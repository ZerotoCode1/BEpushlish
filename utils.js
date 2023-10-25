import jwt from 'jsonwebtoken';
import mg from 'mailgun-js';

export const baseUrl = () =>
  process.env.BASE_URL
    ? process.env.BASE_URL
    : process.env.NODE_ENV !== 'production'
    ? 'http://localhost:3000'
    : 'https://yourdomain.com';

export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    "somethingsecret",
    {
      expiresIn: '30d',
    }
  );
};

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7, authorization.length); // Bearer XXXXXX
    jwt.verify(token, "somethingsecret", (err, decode) => {
      if (err) {
        res.status(401).send({ message: 'Invalid Token' });
      } else {
        req.user = decode;
        next();
      }
    });
  } else {
    res.status(401).send({ message: 'No Token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send({ message: 'Invalid Admin Token' });
  }
};

export const mailgun = () =>
  mg({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMIAN,
  });

export const payOrderEmailTemplate = (order) => {
  return `<h1>Cảm ơn bạn đã mua sắm tại của hàng chúng tôi</h1>
  <p>
  Xin chào: ${order.user.name},</p>
  <p>Chúng tôi đã xử lý xong đơn hàng của bạn.</p>
  <h2>[Order ${order._id}] (${order.createdAt.toString().substring(0, 10)})</h2>
  <table>
  <thead>
  <tr>
  <td><strong>Tên sản phẩm</strong></td>
  <td><strong>Số lượng</strong></td>
  <td><td/>
  <td><strong align="right">Giá tiền</strong></td>
  </thead>
  <tbody>
  ${order.orderItems
    .map(
      (item) => `
    <tr>
    <td>${item.name}</td>
    <td align="center">${item.quantity}</td>
    <td align="center" ><img style="width:100px; height:150px ; margin-left:50px" src=${item.image} /></td>
    <td align="right"> $${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('\n')}
  </tbody>
  <tfoot>
  <tr>
  <td colspan="2">Giá sản phẩm:</td>
  <td align="right"> $${order.itemsPrice.toFixed(2)}</td>
  </tr>
  <tr>
  <td colspan="2">Phí ship:</td>
  <td align="right"> $${order.shippingPrice.toFixed(2)}</td>
  </tr>
  

  
 

  <tr>
  <td colspan="2"><strong>Tổng tiền:</strong></td>
  <td align="right"><strong> $${order.totalPrice.toFixed(2)}</strong></td>
  </tr>
  <tr>
  <td colspan="2">Phương thức thanh toán:</td>
  <td align="right">${order.paymentMethod}</td>
  </tr>
  </table>

  <h2>Địa chỉ nhận hàng</h2>
  <p>
  ${order.shippingAddress.fullName},<br/>
  ${order.shippingAddress.address},<br/>
  ${order.shippingAddress.city},<br/>
  ${order.shippingAddress.country},<br/>
  ${order.shippingAddress.postalCode}<br/>
  </p>
  <hr/>
  <p>
  Cảm ơn bạn đã mua sắm đồ của shop tui.
  </p>
  `;
};


export const payOrderEmailAdminTemplate = (order) => {
  return `<h1>Có đơn hàng mới order</h1>
  <p>
  Tên khách hàng: ${order.user.name},</p>
  <h2>Mã vận đơn:${order._id} (${order.createdAt.toString().substring(0, 10)})</h2>
  <table>
  <thead>
  <tr>
  <td><strong>Tên sản phẩm</strong></td>
  <td><strong style="margin-left:30px">Số lượng</strong></td>
  <td><td/>
  <td><strong align="right">Giá tiền</strong></td>
  </thead>
  <tbody>
  ${order.orderItems
    .map(
      (item) => `
    <tr>
    <td>${item.name}</td>
    <td align="center">${item.quantity}</td>
    <td align="center" ><img style="width:100px; height:150px ; margin-left:50px" src=${item.image} /></td>
    <td align="right" > $${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('\n')}
  </tbody>
  <tfoot>
  <tr>
  <td colspan="2">Giá sản phẩm:</td>
  <td align="right"> $${order.itemsPrice.toFixed(2)}</td>
  </tr>
  <tr>
  <td colspan="2">Phí ship:</td>
  <td align="right"> $${order.shippingPrice.toFixed(2)}</td>
  </tr>
  

  
 

  <tr>
  <td colspan="2"><strong>Tổng tiền:</strong></td>
  <td align="right"><strong> $${order.totalPrice.toFixed(2)}</strong></td>
  </tr>
  <tr>
  <td colspan="2">Phương thức thanh toán:</td>
  <td align="right">${order.paymentMethod}</td>
  </tr>
  </table>

  <h2>Địa chỉ nhận hàng</h2>
  <p>
  ${order.shippingAddress.fullName},<br/>
  ${order.shippingAddress.address},<br/>
  ${order.shippingAddress.city},<br/>
  ${order.shippingAddress.country},<br/>
  ${order.shippingAddress.postalCode}<br/>
  </p>
  `;
};
