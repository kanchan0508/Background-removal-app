// API Controller function to manage clerk user with database

import { Webhook } from "svix";
import userModel from "../models/userModel.js";

// http://localhost:4000/api/user/webhooks

const clerkWebhooks = async (req, res) => {
    try {
        // Create a Svix instance with clerk webhook secret
        const whook = new Webhook(process.env.CLERKWEBHOOK_SECRET_KEY);

        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        });

        const { data, type } = req.body;

        switch (type) {
            case "user.created": {
                const userData = {
                    clerkId: data.id,
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url
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
                    photo: data.image_url
                };

                const updatedUser = await userModel.findOneAndUpdate(
                    { clerkId: data.id },
                    userData,
                    { new: true } // Return the updated document
                );

                if (!updatedUser) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }

                res.json({ success: true, message: "User updated successfully" });
                break;
            }

            case "user.deleted": {
                const deletedUser = await userModel.findOneAndDelete({ clerkId: data.id });

                if (!deletedUser) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }

                res.json({ success: true, message: "User deleted successfully" });
                break;
            }

            default:
                res.status(400).json({ success: false, message: "Unhandled webhook event type" });
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

        const userData = await userModel.findOne({clerkId});
       
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, credits: userData.creditBalance });
       
        
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};



export { clerkWebhooks, userCredits };
