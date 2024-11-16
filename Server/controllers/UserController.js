// API Controller function to manage clerk user with database

import { Webhook } from "svix";
import userModel from "../models/userModel.js";
import razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";

// http://localhost:4000/api/user/webhooks

const clerkWebhooks = async (req, res) => {
  try {
    // Create a Svix instance with clerk webhook secret
    const whook = new Webhook(process.env.CLERKWEBHOOK_SECRET_KEY);

    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;

    switch (type) {
      case "user.created": {
        const userData = {
          clerkId: data.id,
          email: data.email_addresses[0].email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          photo: data.image_url,
        };

        await userModel.create(userData);
        res.json({ success: true, message: "User created successfully" });
        break;
      }

      case "user.updated": {
        const userData = {
          email: data.email_addresses[0].email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          photo: data.image_url,
        };

        const updatedUser = await userModel.findOneAndUpdate(
          { clerkId: data.id },
          userData,
          { new: true } // Return the updated document
        );

        if (!updatedUser) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "User updated successfully" });
        break;
      }

      case "user.deleted": {
        const deletedUser = await userModel.findOneAndDelete({
          clerkId: data.id,
        });

        if (!deletedUser) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "User deleted successfully" });
        break;
      }

      default:
        res
          .status(400)
          .json({ success: false, message: "Unhandled webhook event type" });
        break;
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API controllers function to get user available credits data
const userCredits = async (req, res) => {
  try {
    const { clerkId } = req.body;

    const userData = await userModel.findOne({ clerkId });

    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, credits: userData.creditBalance });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
// gateway initialization function
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// API to make payment for credits
const paymentRazorpay = async (req, res) => {
  try {
    const { clerkId, planId } = req.body;
    const userData = await userModel.findOne({ clerkId });

    if (!userData || !planId) {
      return res.json({ success: false, message: "Invalid request" });
    }
    let credits, plan, amount, date;
    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 10;
        break;

      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 50;
        break;

      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 250;
        break;

      default:
        break;
    }
    date = Date.now();

    // creating transaction

    const transactionData = {
        clerkId,
        plan,
        amount,
        credits,
        date,
    }
    const newTransaction  = await transactionModel.create(transactionData);

    const options = {
        amount: amount * 100, 
        currency: process.env.CURRENCY,
        receipt: newTransaction._id,
    }

    await razorpayInstance.orders.create(options, (error, order)=>{
        if(error){
            return res.json({ success: false, message: error.message });
        }
        res.json({ success: true,order});
    })
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


//API controller function to verify rezorpay  payment
const verifyRezorPayment = async(req,res) =>{
  try {
    const { razorpay_order_id } = req.body
    
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

    if(orderInfo.status === 'paid'){
      const transactionData =  await transactionModel.findById(orderInfo.receipt)
      if(transactionData.payment){
        return res.json({ success: false, message: "Payment failed" });

      }
      // Adding credits in userData
      const userData = await userModel.findOne({clerkId: transactionData.clerkId})
      const creditBalance = userData.creditBalance + transactionData.credits

      await userModel.findByIdAndUpdate(userData._id, { creditBalance })
      //making payment true
      await transactionModel.findByIdAndUpdate(transactionData._id,{payment: true})
      res.json({ success: true, message: "Credit added" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

export { clerkWebhooks, userCredits, paymentRazorpay, verifyRezorPayment };
