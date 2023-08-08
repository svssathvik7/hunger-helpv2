// Program imports
require("dotenv").config();
const es = require("express");
const app = es();
const bp = require("body-parser");
const fs = require("fs");
const encrypt = require("mongoose-encryption");
const browser = require('browser-detect') 
var isLoggedIn = false;
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
var devtxt = months[new Date().getMonth()]+" "+new Date().getUTCDate()+" - Mobile version updated :)\nWorking on security ";
var errmsg = "";
const mongoose = require("mongoose");
const { isErrored } = require("stream");
var availableFood = [];
app.use(bp.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(es.static("public"));


// Database connection
mongoose.connect(("mongodb+srv://sathvikcodes:sathvikcodes@cluster0.hyujunf.mongodb.net/?retryWrites=true&w=majority"));
var db = mongoose.connection;
db.on("error",()=>console.log("Error in connection to Database"))
db.once("open",()=>console.log("Connected to Database Successfully"));

const MemberSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    orgname : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    role : {
        type : String,
    }
});

const DonateSchema = new mongoose.Schema({
    ftype : {
        type : String
    },
    quality : {
        type : String
    },
    quantity : {
        type : Number
    },
    contact : {
        type : String
    },
    organisation : {
        type : String
    },
    expiry : {
        type : String,
        required : true
    },
    message : {
        type : String
    }
});

// Encryptions
MemberSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});



var Memberdb = new mongoose.model("members",MemberSchema);
var Fooddb = new mongoose.model("food",DonateSchema);
// Home page code

const title_txt = "Welcome to HungerHelp!";
const desc_txt = "Together, we are tackling hunger and making a difference in our community. At HungerHelp, we connect local food establishments, food banks, shelters, and individuals in need, creating a seamless platform to reduce food waste and address food insecurity. Through our web application, you can easily donate surplus food, volunteer your time, and ensure that no one goes hungry. Join us in this meaningful mission and make a positive impact on the lives of others.";
const emphasis_txt = "Together, we can fight hunger, one meal at a time.";
const curFeedbackState = true;
var volunteercnt=0;
var membercnt=0;
async function getMembersCounts(){
    volunteercnt = await Memberdb.countDocuments({role:"volunteer"});
    membercnt = await Memberdb.countDocuments({role:"member"});
    console.log(volunteercnt);
    console.log(membercnt);
    return [volunteercnt,membercnt];
}
async function getDonationCount(){
    var numdonations = Fooddb.countDocuments({quantity:3});
    return numdonations;
}
var statBoxData = [
    {
        key : 1,
        alt : "donations",
        src : "/donatepic.svg",
        desc : "Donations",
        count : getDonationCount().then((donationCount)=>{
            statBoxData[0].count = donationCount;
        })
    },
    {
        key : 2,
        alt : "volunteers",
        src : "/volunteer-card.svg",
        desc : "Volunteers",
        count : getMembersCounts().then((countval)=>{
            statBoxData[1].count = countval[0];
            statBoxData[2].count = countval[1];
        })
    },
    {
        key : 3,
        alt : "members image",
        src : "/members.svg",
        desc : "Members",
        count : membercnt
    },
    {
        key : 4,
        alt : "love image",
        src : "/heart.svg",
        desc : "Fed",
        count : 300
    }
];
const aside_img = [
    "https://media.istockphoto.com/id/1355624220/vector/vector-illustration-please-dont-waste-food-designs-for-world-food-day-and-international.jpg?s=612x612&w=0&k=20&c=_noGR7l39IG46d6RGE4x54DBC8sg1pD1xzDUfz5pb4E=",
    "https://i.pinimg.com/736x/bd/42/24/bd4224bdc0d7361c33324daba0c59b53.jpg",
    "https://media.istockphoto.com/id/1223169200/vector/food-and-grocery-donation.jpg?s=612x612&w=0&k=20&c=0fv8hwXeS9RCL-ewqkr2oyi0Nu8jAQxGtroS0XA9nsQ=",
    "https://cdn1.i-scmp.com/sites/default/files/styles/1200x800/public/2013/10/16/4541f88991b90cae31fe995a28027086.jpg?itok=w_-PQMW2",
    "https://static.vecteezy.com/system/resources/previews/013/926/882/original/biofuel-life-cycle-of-natural-materials-and-plants-with-green-barrels-or-biogas-production-energy-in-flat-cartoon-hand-drawn-templates-illustration-vector.jpg"
];
app.get("/",function(req,res)
{
    isLoggedIn = false;
    errmsg = "";
    var isMobile = browser(req.headers['user-agent']).mobile;
    if(!isMobile)
    {
        res.render("desktop/index",{cdevmsg:devtxt,titleTxt:title_txt,descTxt:desc_txt,emphasis:emphasis_txt,obj:statBoxData,imgsrc:aside_img[[Math.floor(Math.random()*(aside_img.length))]]});
    }
    else{
        res.render("mobile/index",{cdevmsg:devtxt,titleTxt:title_txt,descTxt:desc_txt,emphasis:emphasis_txt,obj:statBoxData,imgsrc:aside_img[[Math.floor(Math.random()*(aside_img.length))]]});
    }
});

// Join page
app.get("/register",function(req,res){
    var isMobile = browser(req.headers['user-agent']).mobile;
    if(isMobile)
    {
        res.render("mobile/register");
    }
    else{
        res.render("desktop/register",{cdevmsg:devtxt});
    }
});

app.post("/submitform",(req,res)=>{
    var uname = req.body.username;
    var umail = req.body.usermail;
    var ufeedback = req.body.userfeedback;
    const formData = `Username: ${uname}\nUsermail: ${umail}\nUserfeedback: ${ufeedback}\n\n`;
    
    // Append the form data to a file
    fs.appendFile(__dirname+"/views/data.txt", formData, (error) => {
        if (error) {
            console.log("Error occurred while writing to file:", error.message);
            res.redirect("/"); // Redirect to home page or handle the error accordingly
        }
        console.log("Form data written to file successfully"); // Redirect to home page or a success page
    });
    res.redirect("/");
});

app.post("/newuser",async(req,res)=>{
    var data = new Memberdb({
        name : req.body.name,
        orgname : req.body.orgname,
        email : req.body.email,
        password : req.body.password,
        role : req.body.role
    });
    try{
        await data.save();
        if(data.role == "volunteer"){
            statBoxData[1].count++;
            res.render("desktop/success",{cdevmsg:devtxt});
        }
        else{
            statBoxData[2].count++;
            res.render("desktop/success",{cdevmsg:devtxt});
        }
    }
    catch(error){
        console.log("Error saving");
        res.render("desktop/failentry",{cdevmsg:devtxt});
    }
});

// Donate food
app.get("/donate-food",(req,res)=>{
    var isMobile = browser(req.headers['user-agent']).mobile;
    if(isMobile)
    {
        res.render("mobile/donate_food",{loginState:isLoggedIn,errortxt:errmsg});
    }
    else{
        res.render("desktop/donate_food",{cdevmsg:devtxt,loginState:isLoggedIn,errortxt:errmsg});
    }
});
app.post("/login",async(req,res)=>{
    var lmail = req.body.email;
    var lpass = req.body.password;
    try{
        var userLoggingIn = await Memberdb.findOne({email:lmail});
        if(userLoggingIn)
        {
            if(userLoggingIn.password === lpass)
            {
                isLoggedIn = true;
                res.redirect(req.get('referer'));
                console.log("Login detected");
            }
            else{
                errmsg = "Password incorrect";
                isLoggedIn = false;
                res.redirect(req.get('referer'));
            }
        }
        else{
            errmsg = "No user found";
            isLoggedIn = false;
            res.redirect(req.get('referer'));
        }
    }
    catch(error){
        console.log("error logging in");
    }
});
app.post("/addFood",(req,res)=>{
    var expirationTimestamp = new Date();
    expirationTimestamp.setTime(new Date().getTime() + req.body.expiry * 60 * 1000);
    var expirationTime = expirationTimestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    var data = new Fooddb({
        ftype : req.body.foodtype,
        quality : req.body.quality,
        quantity : parseInt(req.body.quantity),
        contact : req.body.contactnumber,
        organisation : req.body.organisation,
        expiry : expirationTime,
        message : req.body.custommessage
    });
    try{
        data.save();
        statBoxData[0].count = statBoxData[0].count+1;
    }
    catch(error)
    {
        console.log(error);
    }
    res.redirect("/donate-food");
});


// Request food
app.get("/request-food",async(req,res)=>{
    var availableFood = [];
    var availableFood = await Fooddb.find({});
    var isMobile = browser(req.headers['user-agent']).mobile;
    if(isMobile)
    {
        res.render("mobile/req_food",{loginState:isLoggedIn,errortxt:errmsg,data:availableFood});
    }
    else{
        res.render("desktop/req_food", {cdevmsg:devtxt, loginState: isLoggedIn, errortxt: errmsg, data: availableFood });
    }// Handle the error appropriately, e.g., display an error message
});

app.get("/statistics",(req,res)=>{
    var isMobile = browser(req.headers['user-agent']).mobile;
    if(isMobile)
    {
        res.render("mobile/stats");
    }    
    else{
        res.render("desktop/stats",{cdevmsg:devtxt});
    }
});

app.get("/about",(req,res)=>{
    var isMobile = browser(req.headers['user-agent']).mobile;
    if(isMobile)
    {
        res.render("mobile/about");
    }
    else{
        res.render("desktop/about",{cdevmsg:devtxt});
    }
});

app.listen(3000,()=>{
    console.log("Running");
});