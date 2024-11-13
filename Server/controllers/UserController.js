
// API Controller function to manage clerk user with database

import { Webhook } from "svix"
import userModel from "../models/userModel.js";

// http://localhost:4000/api/user/webhooks

const clerkWebhooks = async (req, res) => {
    try {
        //create a Svix instance with clerk webhook secret
        const whook = new Webhook(process.env.CLERKWEBHOOK_SECRET_KEY)

        await whook.verify(JSON.stringify(req.body),{
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        });

        const {data, type} = req.body

        switch (type) {
            case "user.created":{
                const userData = {
                    clerkId: data.id,
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url
                }

                await userModel.create(userData)
                res.json({})

                break;
            }

            case "user.updated": {
                const userData = {
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url
                }
                
                await userModel.findByIdAndUpdate({clerkId:data.id}, userData)
                res.json({})

                break;

            }
            case "user.deleted": {
                await userModel.findByIdAndDelete({clerkId: data.id})
                res.json({})

                break;
            }

            default:
                break;
                
        }
        
    } catch (error) {
        console.error(error.message)
        res.json({success: false, message:error})
    }
}

// API controllers function to get user available credits data
const userCredits = async(req,res) => {
    try {
        const {clerkId} = req.body

        const userData = await userModel.findOne({clerkId})
        res.json({success: true, credits: userData.creditBalance })
        
    } catch (error) {
        console.error(error.message)
        res.json({success: false, message:error})
    }
}


export {clerkWebhooks, userCredits}