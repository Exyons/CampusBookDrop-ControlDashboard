const User = require("../models/user");
const Order = require("../models/order");
const DeliveryOrder = require("../models/delivery_order");
const { Product } = require("../models/product");
const { Address } = require("../models/address");

const renderAdminDashboard = async (req, res) => {
    let orders = [];
    let deliveryOrders = [];
    try {
        orders = await Order.find({});
        deliveryOrders = await DeliveryOrder.find({}).populate("delivery_user");
    } catch (error) {
        req.flash("error", "Server Error!");
        res.redirect("/");
    }
    res.render("dashboard/index", { orders, deliveryOrders })
}

const updateOrderStatus = async (req, res) => {
    const { orderId, status, statusComment } = req.body
    try {
        const order = await Order.findByIdAndUpdate(orderId, { status, statusComment })
        if (status === "confirmed") {
            const deliveryOrder = await DeliveryOrder.findOneAndUpdate({ order_id: order.order_id }, { payment_status: "confirmed" });
            if (!deliveryOrder) {
                return res.json({ error: "Cannot Set Payment Status of Delivery Order To Confirmed Also!" })
            }
        }
        if (!order) {
            return res.json({ error: "Order Not Found!" })
        }
        res.json({ success: "Status Saved!" })
    } catch (error) {
        res.json({ error: "Server Error" })
    }
}

const updateDeliveryOrderStatus = async (req, res) => {
    const { deliveryOrderId, delivery_status, orderId } = req.body
    const orderStatus = ["confirmed", "canceled", "delivered", "returned", "pickedup"];
    try {
        const deliveryOrder = await DeliveryOrder.findById(deliveryOrderId)
        if (!deliveryOrder) {
            return res.json({ error: "Delivery Order Not Found!" })
        }
        
        const order = await Order.findOne({ order_id: orderId })
        if (!order) {
            return res.json({ error: "Order details of the delivery order does not exist!" })
        }
        if (!orderStatus.includes(order.status)){
            return res.json({error: "Payment Is Not Verified of The Order!"})
        }

        if (deliveryOrder.delivery_status === "delivered") {
            return res.json({ error: "The products are already delivered!" })
        }

        if(delivery_status === "locked" && deliveryOrder.delivery_status === "locked"){
            return res.json({ error: "Already Locked!" })
        }
        
        if(delivery_status === "pickedup" && deliveryOrder.delivery_status === "pickedup"){
            return res.json({ error: "Already Marked PickedUp!" })
        }

        deliveryOrder.delivery_status = delivery_status
        
        if (delivery_status === "delivered") {
            order.status = "delivered" 
            order.statusComment = "Order Delivered Successfully!";
        }

        if (delivery_status === "pickedup") {
            order.status = "pickedup" 
            order.statusComment = "Order has been pickedup!";
        }

        await order.save();
        await deliveryOrder.save();
        res.json({ success: "Status Saved!" })
    } catch (error) {
        console.log(error);
        res.json({ error: "Server Error" })
    }
}

module.exports = {
    renderAdminDashboard,
    updateOrderStatus,
    updateDeliveryOrderStatus
}