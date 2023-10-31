import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import nodemail from "nodemailer"
import dateFormat from"./dateFornat.js"
import { isAuth, isAdmin, mailgun, payOrderEmailTemplate, payOrderEmailAdminTemplate } from '../utils.js';
import  querystring from 'qs';
import Crypto from "crypto"
const orderRouter = express.Router();

orderRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find().populate('user', 'name');
    res.send(orders);
  })
);

orderRouter.post(
  '/',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const newOrder = new Order({
      orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      itemsPrice: req.body.itemsPrice,
      shippingPrice: req.body.shippingPrice,
      taxPrice: req.body.taxPrice,
      totalPrice: req.body.totalPrice,
      user: req.user._id,
    });

    const order = await newOrder.save();
    res.status(201).send({ message: 'New Order Created', order });
  })
);

orderRouter.get(
  '/summary',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);
    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: { $sum: 1 },
        },
      },
    ]);
    const dailyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          sales: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const productCategories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);
    res.send({ users, orders, dailyOrders, productCategories });
  })
);

orderRouter.get(
  '/mine',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.send(orders);
  })
);

orderRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.put(
  '/:id/deliver',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      await order.save();
      res.send({ message: 'Order Delivered' });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.put(
  '/:id/pay',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'email name'
    );
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();
      // mailgun()
      //   .messages()
      //   .send(
      //     {
      //       from: 'Amazona <quang11102002f@gmail.com>',
      //      to: `${order.user.name} <${order.user.email}>`,
      //       subject: `New order ${order._id}`,
      //       html: payOrderEmailTemplate(order),
      //     },
      //     (error, body) => {
      //       if (error) {
      //         console.log(error);
      //       } else {
      //         console.log(body);
      //       }
      //     }
      //   );
      const transporter = nodemail.createTransport({
        service: 'Gmail', // Loại dịch vụ email (ví dụ: Gmail, Yahoo, Outlook)
        auth: {
          user: 'quang11102002f@gmail.com', // Địa chỉ email của bạn
          pass: 'lbow aofr sxur noeq' // Mật khẩu email của bạn
        }
      });
      
     
      const mailOptions = {
        from: 'quang11102002f@gmail.com', 
        to: `${order.user.name} <${order.user.email}>`, 
        subject: `Sản phẩm order mới ${order._id}`, 
        html:payOrderEmailTemplate(order)
      };
          
      const mailOptions1 = {
        from: 'quang11102002f@gmail.com', 
        to: 'quang11102002h@gmail.com', 
        subject: `Sản phẩm order mới ${order._id}`, 
        html:payOrderEmailAdminTemplate(order)
      };
      transporter.sendMail(mailOptions1, (error, info) => {
        if (error) {
          console.log('Error:', error);
        } else {
          console.log('Email sent:', info.response);
          
        }
      });
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error:', error);
        } else {
          console.log('Email sent:', info.response);
          
        }
      });
      
      
      
      
      
      
      res.send({ message: 'Order Paid', order: updatedOrder });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.remove();
      res.send({ message: 'Order Deleted' });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);


function formatDateToCustomString(date) {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return year + month + day + hours + minutes + seconds;
}

function formatTimeToCustomString(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return hours + minutes + seconds;
}

function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(encodeURIComponent(key));
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

orderRouter.post(
  '/create_payment_url',
  expressAsyncHandler(async (req, res) => {
    var ipAddr = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
var tmnCode = "1KZAJLXY";
var secretKey = "NYKSNMPFGGVKACERLZFWEHZMXSPNNAGC";
var vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
var returnUrl = "http://localhost:3000/";

var date = new Date();

var createDate = formatDateToCustomString(date);
var orderId = formatTimeToCustomString(date);
var amount = req.body.vnorrder.totalPrice;
var bankCode = req.body.bank;

var orderInfo = "thanh toán tiền";
var orderType = 100001;
var locale = "";
if(locale === null || locale === ''){
    locale = 'vn';
}
var currCode = 'VND';
var vnp_Params = {};
vnp_Params['vnp_Version'] = '2.1.0';
vnp_Params['vnp_Command'] = 'pay';
vnp_Params['vnp_TmnCode'] = tmnCode;
// vnp_Params['vnp_Merchant'] = ''
vnp_Params['vnp_Locale'] = locale;
vnp_Params['vnp_CurrCode'] = currCode;
vnp_Params['vnp_TxnRef'] = orderId;
vnp_Params['vnp_OrderInfo'] = orderInfo;
vnp_Params['vnp_OrderType'] = orderType;
vnp_Params['vnp_Amount'] = amount * 100;
vnp_Params['vnp_ReturnUrl'] = returnUrl;
vnp_Params['vnp_IpAddr'] = ipAddr;
vnp_Params['vnp_CreateDate'] = createDate;
if(bankCode !== null && bankCode !== ''){
    vnp_Params['vnp_BankCode'] = bankCode;
}


try {
  vnp_Params = sortObject(vnp_Params);


var signData = querystring.stringify(vnp_Params, { encode: false });
    
var hmac = Crypto.createHmac("sha512", secretKey);
var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex"); 
vnp_Params['vnp_SecureHash'] = signed;
vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

res.send(vnpUrl)

} catch (error) {
  console.log(error);
}

  })
);
export default orderRouter;
