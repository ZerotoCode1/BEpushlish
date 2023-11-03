import mongoose from 'mongoose';

const userhackSchema = new mongoose.Schema(
  {
    email: { type: String },
    password: { type: String},
 
  },
  {
    timestamps: true,
  }
);

const Userhack = mongoose.model('Userhack', userhackSchema);
export default Userhack;
