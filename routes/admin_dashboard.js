const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/WrapAsync");
const { renderAdminDashboard,
    updateOrderStatus,
    updateDeliveryOrderStatus } = require("../controllers/admin_dashboard");

router.get("/", wrapAsync(renderAdminDashboard));

router.post("/order/updateStatus", wrapAsync(updateOrderStatus));

router.post("/deliveryOrder/updateStatus", wrapAsync(updateDeliveryOrderStatus));

module.exports = router;
