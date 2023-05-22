require("dotenv").config()
let dbUrl = "";
if (process.env.NODE_ENV !== "production") {
    dbUrl = "mongodb://127.0.0.1:27017/BookSellingApp"
}
else {
    dbUrl = process.env.MONGODB_URL 
}

const express = require("express")
const path = require("path")
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const wrapAsync = require("./utils/WrapAsync")

mongoose.connect(dbUrl)
.then(() => {
    console.log("DB Connected");
})
.catch(() => {
    console.log("Connection error");
})

const app = express();
const root = __dirname;

const sessionSecret = process.env.SESSION_SECRET;

// Using mongo-store to store session data
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secrete: sessionSecret,
        touchAfter: 24 * 3600 // time period in seconds
    }
})

const sessionOptions = {
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 1 // 1hour time period in milliseconds
    }
}

app.use(session(sessionOptions));
app.use(flash());
app.use(methodOverride("_method"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(root, "views"));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.use(express.static(path.join(root, 'public')));

// Making flash messages available in flash template page for easy access by setting them to res.locals
app.use(wrapAsync(async (req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
}))

app.get("/", (req, res) => {
    res.render("home");
})

const admin_dashboard_route = require("./routes/admin_dashboard");
app.use("/dashboard", admin_dashboard_route);


app.use((err, req, res, next) => {
    // console.log(err);
    const { status = 500 } = err;
    // if(!err.message)
    // const message = err.message.details(e=>e.message).join(",");
    if (!err.message) {
        err.message = "Oh No! Something Went Wrong";
    }
    const title = "Error Occured"
    req.flash("error", err.message);
    res.status(status).render("error", { title, page_styles: "", err });
})

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log("Listening On Port", port);
})