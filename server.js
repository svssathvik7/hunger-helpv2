// Program imports
const es = require("express");
const app = es();
const bp = require("body-parser");
const fs = require("fs");
const browser = require('browser-detect') 
var isLoggedIn = false;
var errmsg = "";
const mongoose = require("mongoose");
var availableFood = [];
app.use(bp.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(es.static("public"));

// Database connection
mongoose.connect(("mongodb+srv://sathvikcodes:sathvikcodes@cluster0.hyujunf.mongodb.net/?retryWrites=true&w=majority"));
var db = mongoose.connection;
db.on("error",()=>console.log("Error in connection to Database"))
db.once("open",()=>console.log("Connected to Database Successfully"));

app.get("/statistics",(req,res)=>{
    res.render("desktop/stats",{cdevmsg:devtxt});
});

app.get("/about",(req,res)=>{
    res.render("desktop/about",{cdevmsg:devtxt});
});

app.listen(3000,()=>{
    console.log("Running");
});

// Home page code
const title_txt = "Welcome to HungerHelp!";
const desc_txt = "Together, we are tackling hunger and making a difference in our community. At HungerHelp, we connect local food establishments, food banks, shelters, and individuals in need, creating a seamless platform to reduce food waste and address food insecurity. Through our web application, you can easily donate surplus food, volunteer your time, and ensure that no one goes hungry. Join us in this meaningful mission and make a positive impact on the lives of others.";
const emphasis_txt = "Together, we can fight hunger, one meal at a time.";
const curFeedbackState = true;
var volunteercnt=0;
var membercnt=0;
async function getMembersCounts(){
    volunteercnt = await db.collection("members").countDocuments({type:"volunteer"});
    membercnt = await db.collection("members").countDocuments({type:"member"});
    console.log(volunteercnt);
    console.log(membercnt);
    return [volunteercnt,membercnt];
}
async function getDonationCount(){
    var numdonations = db.collection("food").countDocuments({});
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
var devtxt = "Making it responsive to your monitor size :)";
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
    res.render("desktop/register",{cdevmsg:devtxt});
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

app.post("/newuser",(req,res)=>{
    var data = {
        name : req.body.name,
        org : req.body.orgname,
        mail : req.body.email,
        pass : req.body.password,
        type : req.body.role
    };
    db.collection("members").findOne({mail:data.mail},(found,err)=>{
        if(found){
            console.log("User exists!");
        }
        else{
            db.collection("members").insertOne(data,(err,collection)=>{
                if(err) throw err;
                console.log("Record Inserted Successfully");
                if(data.type == "volunteer")
                    statBoxData[1].count++;
                else
                    statBoxData[2].count++;
            });
            res.render("desktop/success",{cdevmsg:devtxt});
        }
    })
});

// Donate food
app.get("/donate-food",(req,res)=>{
    res.render("desktop/donate_food",{cdevmsg:devtxt,loginState:isLoggedIn,errortxt:errmsg});
});
app.post("/login",(req,res)=>{
    var lmail = req.body.email;
    var lpass = req.body.password;
    db.collection("members").findOne({mail:lmail},(err,foundUser)=>{
        if(err){
            console.log(err);
        }
        if(foundUser){
            if(foundUser.pass === lpass)
            {
                isLoggedIn = true;
                res.redirect(req.get('referer'));
                console.log("Login detected");
            }
            else{
                errmsg = "No user found";
                isLoggedIn = false;
                res.redirect(req.get('referer'));
            }
        }
        else{
            errmsg = "No user found :(";
            isLoggedIn = false;
            res.redirect("/donate-food");
        }
    })
});
app.post("/addFood",(req,res)=>{
    var temp = {
        ftype : req.body.foodtype,
        quality : req.body.quality,
        quantity : req.body.quantity,
        contact : req.body.contactnumber,
        organisation : req.body.organisation,
        expiry : req.body.expiry*60,
        message : req.body.custommessage
    };
    availableFood = availableFood + temp;
    db.collection("food").insertOne(temp,(err,collection)=>{
        if(err){
            throw err;
        }
        else{
            console.log("item added");
            statBoxData[0].count = statBoxData[0].count+1;
        }
        res.redirect("desktop/donate-food");
    });
    console.log(availableFood);
});





// Request food
app.get("/request-food",(req,res)=>{
    var availableFood = [];
    db.collection("food")
    .find({})
    .toArray()
    .then((documents) => {
      availableFood = documents;

      res.render("desktop/req_food", {cdevmsg:devtxt, loginState: isLoggedIn, errortxt: errmsg, data: availableFood });
    })
    .catch((error) => {
      console.log("Error retrieving documents from the 'food' collection:", error);
      // Handle the error appropriately, e.g., display an error message
    });
});
