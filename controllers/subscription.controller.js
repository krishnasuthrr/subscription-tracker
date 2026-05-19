import subscriptionModel from "../models/subscription.model.js"

export const createSubscription = async (req, res, next) => {

    try {
        
        const subscription = await subscriptionModel.create({
            ...req.body,
            user: req.user._id
        })

        return res.status(201).json({ success: true, message: "Subscription Created", subscription });

    } catch (error) {
        next(error)
    }

}

export const getUserSubscriptions = async (req, res, next) => {

    try {

        if (req.user.id !== req.params.id) {
            const error = new Error("Unauthorized User")
            error.statusCode = 401
            throw error
        }
        
        const subscriptions = await subscriptionModel.find({ user: req.user._id })

        if(subscriptions.length <= 0) {
            return res.status(200).json({ message: "No Subscriptions found for this User" })
        }

        return res.status(200).json({ success: true, subscriptions })

    } catch (error) {
        next(error)
    }

}

export const getAllSubscriptions = async (req, res, next) => {

    try {
        
        const subscriptions = await subscriptionModel.find()

        if (subscriptions.length <= 0) {
            return res.status(200).json({ message: "No Subscriptions found" });
        }

        return res.status(200).json({ success: true, subscriptions })

    } catch (error) {
        next(error)
    }

}

export const getSubscriptionById = async (req, res, next) => {

    try {
        
        const subscription = await subscriptionModel.findById(req.params.id)

        if(!subscription) {
            const error = new Error("Invalid Subscription Id")
            error.statusCode = 400
            throw error
        }

        return res.status(200).json({ success: true, subscription });

    } catch (error) {
        next(error)
    }

}

export const updateSubscription = async (req, res, next) => {

    try {
        
        const subscription = await subscriptionModel.findById(req.params.id)

        if (!subscription) {
          const error = new Error("Invalid Subscription Id");
          error.statusCode = 400;
          throw error;
        }

        if (!subscription.user.equals(req.user._id)) {
          const error = new Error("Unauthorized User");
          error.statusCode = 401;
          throw error;
        }

        subscription.set(req.body)

        const updatedSubscription = await subscription.save()

        return res.status(200).json({ success: true, updatedSubscription })

    } catch (error) {
        next(error)
    }

}

export const deleteSubscription = async (req, res, next) => {

    try {
        
        const subscription = await subscriptionModel.findById(req.params.id)

        if (!subscription) {
          const error = new Error("Invalid Subscription Id");
          error.statusCode = 400;
          throw error;
        }

        if (!subscription.user.equals(req.user._id)) {
          const error = new Error("Unauthorized User");
          error.statusCode = 401;
          throw error;
        }

        await subscription.deleteOne()

        res.status(200).json({ success: true, message: "Subscription deleted successfully" });

    } catch (error) {
        next(error)
    }

}