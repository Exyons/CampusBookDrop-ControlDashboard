const dashboardLinks = document.querySelectorAll(".dashboard-lnk");
const contents = document.querySelectorAll(".content");
const dashboardNavbar = document.querySelector(".dashboard-navbar");
const dashboardContainer = document.querySelector(".dashboard-container");
const orderStatusCommentFormModal = document.querySelector(".satus-comment-modal");
const submitOrderStatusCommentBtn = document.querySelector(".submit-order-status-comment-btn");
const orderStatusForm = document.querySelector(".order-status-form");
const orderStatusFormInput = document.querySelector(".order-status-form-input");
const paymentIdContainer = document.querySelector("#paymentIdContainer");


orderStatusCommentFormModal.addEventListener('shown.bs.modal', () => {
    orderStatusFormInput.focus();
})

orderStatusCommentFormModal.addEventListener("hide.bs.modal", () => {
    // After the modal is closed I am removing the validations done in form
    orderStatusForm.classList.remove('was-validated');
})

const orderStatusCommentBootstrapModal = new bootstrap.Modal(orderStatusCommentFormModal);

const hostels = { TH: "Tilak Hostel", PH: "Patel Hostel", MH: "Malviya Hostel" };
const programme = { btech: "B.Tech.", mtech: "M.Tech.", phd: "Ph.D." };

orderStatusForm.onsubmit = event => event.preventDefault();

submitOrderStatusCommentBtn.addEventListener("click", (event) => {
    if (!orderStatusForm.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
    }
    orderStatusForm.classList.add('was-validated')
})

function ChangeStyles() {
    for (let child of dashboardNavbar.children) {
        if (child.style.borderLeft) {
            child.classList.add("selected");
        }
    }
    dashboardNavbar.style.flexDirection = "row";
}

function AddBottomBorder(ref) {
    ref.classList.add("selected");
    for (let child of dashboardNavbar.children) {
        if (child !== ref) {
            child.classList.remove("selected");
        }
    }
}

function ShowContent(ref) {
    if (ref.classList.contains("selected")) {
        for (let content of contents) {

            if (content.classList[1] === ref.classList[1]) {
                content.style.display = "flex";
            }
            else {
                content.style.display = "none";
            }
        }
    }
}

function PerformActions() {
    AddBottomBorder(this);
    ShowContent(this);
}

// Changing the content box to show the contents of the navbar item which has selected class
for (let link of dashboardLinks) {
    if (link.classList.contains("selected")) {
        for (let content of contents) {
            if (content.classList[1] === link.classList[1]) {
                content.style.display = "flex";
            }
            else {
                content.style.display = "none";
            }
        }
    }
    link.addEventListener("click", PerformActions);
}

const teenBindiBtn = document.querySelectorAll(".teen-bindi");
if (teenBindiBtn.length) {
    teenBindiBtn.forEach(btn => {
        // The way I am implementing to show the teen bindi body requires 
        // the button to already have class of pressed
        btn.classList.add("pressed");
        btn.addEventListener("click", () => {
            const teenBindiBody = document.querySelectorAll(".teen-bindi-body");
            teenBindiBody.forEach(body => {
                if (btn.id === body.id) {
                    if (btn.classList.contains("pressed")) {
                        body.style.display = "block";
                        btn.classList.remove("pressed")
                    }
                    else {
                        body.style.display = "none";
                        btn.classList.add("pressed");
                    }
                }
            })
        })
    })
}

const showDeliveryOptionsBtn = document.querySelectorAll(".show-delivery-options-btn");
if (showDeliveryOptionsBtn.length) {
    showDeliveryOptionsBtn.forEach(btn => {
        // The way I am implementing to show the teen bindi body requires 
        // the button to already have class of pressed
        // btn.disabled = ["locked", "delivered", "pickedup"].includes(order.delivery_status)
        btn.classList.add("pressed");
        btn.addEventListener("click", () => {
            const showDeliveryOptionsBody = document.querySelectorAll(".show-delivery-options-body");
            showDeliveryOptionsBody.forEach(body => {
                if (btn.id === body.id) {
                    if (btn.classList.contains("pressed")) {
                        body.style.display = "block";
                        btn.classList.remove("pressed")
                    }
                    else {
                        body.style.display = "none";
                        btn.classList.add("pressed");
                    }
                }
            })
        })
    })
}

const orderStatusValue = document.querySelector("#orderStatusValue");
const orderIdInput = document.querySelector("#orderId");
const paymentIdInput = document.querySelector("#paymentId");
const orderStatusBtns = document.querySelectorAll(".order-status-btn");
orderStatusBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        orderStatusCommentBootstrapModal.show();
        orderStatusValue.value = btn.innerText;
        orderIdInput.value = btn.id;
        if(btn.classList.contains("confirmed")){
            paymentIdContainer.classList.replace("d-none", "d-block")
        }
    })
})

submitOrderStatusCommentBtn.addEventListener("click", async () => {
    const paymentIdInput = document.querySelector("#paymentId");
    try {
        const res = await axios.post("/dashboard/order/updateStatus", {
            status: orderStatusValue.value,
            statusComment: orderStatusForm.elements.statusComment.value,
            orderId: orderIdInput.value,
            paymentId: paymentIdInput.value
        })

        if (res.data.success) {
            orderStatusCommentBootstrapModal.hide();
            showToast(res.data)
        }
    } catch (error) {
        console.log(error)
        showToast({ error: "Cannot Update Status!" })
    }
})

const deliveryStatusBtns = document.querySelectorAll(".delivery-status-btn");
const deliveryTabOrderId = document.querySelector("#deliveryTabOrderId");
deliveryStatusBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
        try {
            const res = await axios.post("/dashboard/deliveryOrder/updateStatus", {
                delivery_status: btn.innerText,
                deliveryOrderId: btn.id,
                orderId: btn.parentElement.id,
            })
            console.log(res.data)
            showToast(res.data)
        } catch (error) {
            showToast({ error: "Cannot Update Status!" })
        }
    })
})