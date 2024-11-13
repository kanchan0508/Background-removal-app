import jwt from 'jsonwebtoken';

// Middleware to validate JWT token 

const authUser = async (req, res, next) => {
    try {
        const {token} = req.headers

        if(!token) {
            return res.json({success: false, message: 'Not Authorized login Again'})

        }
        const token_decode = jwt.decode(token)
        request.body.clerkId = token_decode.clerkId
        next()
        
    } catch (error) {
        console.error(error.message)
        res.json({success: false, message:error})
    }
}

export default authUser;