import mongoose from 'mongoose';

const userhackSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
 
  },
  {
    timestamps: true,
  }
);

const Userhack = mongoose.model('Userhack', userhackSchema);
export default Userhack;
