// Program imports
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import fs from "fs";
import axios from "axios";
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import browserDetect from "browser-detect";
import md5 from "md5";
var devtxt = "ML, Responsiveness added!";
// db imports
import Biogasdb from "./models/BiogasModel.js";
import Memberdb from "./models/MemberModel.js";
import Fooddb from "./models/FoodModel.js";
import db from "./Authentications/dataBase.js";
import FeedbackDb from "./models/FeedbackModel.js";
// Home page constants
import HomePage from "./constants/HomePage.js";
// faqs
import faq from "./constants/FAQ.js";

// express app intialisation
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
var curryear = new Date().getFullYear();

// sessions
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 5 * 60 * 1000 // 5 minutes
  }
}));

const sessionChecker = (req, res, next) => {
if (req.session && req.session.lastAccess && (Date.now() - req.session.lastAccess > 5 * 60 * 1000)) {
  req.session.isLoggedIn = false;
  req.session.isadminbool = false;
  req.session.errmsg = '';
}
req.session.lastAccess = Date.now();
next();
};

app.use(sessionChecker);


// Modify the sessionChecker to handle writing to userLogs.txt
app.use((req, res, next) => {
  if (req.session.username) {
    const username = req.session.username;
    const logMessage = `User ${username} logged in at ${new Date().toLocaleString()}\n`;

    // Path to the userLogs.txt file
    const logFilePath = './Logs/userLogs.txt';

    // Append the log message to the file
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Error writing to userLogs.txt:', err);
        // Handle the error, e.g., log it or take appropriate action
      }
    });
  }
  next();
});
// Home page code
var volunteercnt = 0;
var membercnt = 0;
async function getMembersCounts() {
  volunteercnt = await Memberdb.countDocuments({ role: "volunteer" });
  membercnt = await Memberdb.countDocuments({ role: "member" });
  return [volunteercnt, membercnt];
}
async function getDonationCount() {
  var numdonations = await Fooddb.countDocuments({
    expiry: { $gt: new Date().getTime() },
  });
  return numdonations;
}
async function getBiogasCount() {
  var numbio = await Biogasdb.countDocuments({});
  return numbio;
}
var statBoxData = [
  {
    key: 1,
    alt: "biogas",
    src: "/bio-gas.svg",
    desc: "Biogas",
    count: Biogasdb.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]).then((result) => {
      var biocount = result[0].totalQuantity;
      biocount = biocount * 0.03;
      statBoxData[0].count = biocount.toPrecision(3) + "m³";
    }).catch((err)=>{
      console.log(err);
    }),
  },
  {
    key: 2,
    alt: "volunteers",
    src: "/volunteer-card.svg",
    desc: "Volunteers",
    count: getMembersCounts().then((countval) => {
      statBoxData[1].count = countval[0];
      statBoxData[2].count = countval[1];
    }),
  },
  {
    key: 3,
    alt: "members image",
    src: "/members.svg",
    desc: "Members",
    count: membercnt,
  },
  {
    key: 4,
    alt: "love image",
    src: "/heart.svg",
    desc: "Fed",
    count: 0,
  },
  {
    key: 5,
    alt: "donations",
    src: "/donatepic.svg",
    desc: "Donations",
    count: getDonationCount().then((donationCount) => {
      statBoxData[4].count = donationCount;
      getBiogasCount().then((biocount) => {
        statBoxData[4].count += biocount;
      });
    }),
  },
];
app.get("/", async (req, res) => {
    const currentTime = new Date().getTime(); // Get current time in milliseconds
    // Find and process expired food items
    Fooddb.find({ expiry: { $lte: currentTime } })
      .then(async (expiredFoodItems) => {
        for (const item of expiredFoodItems) {
          const existingBiogasEntry = await Biogasdb.findOne({
            organisation: item.organisation,
          });
          if (existingBiogasEntry) {
          // Update the existing Biogasdb entry by adding the current quantity
            await Biogasdb.findOneAndUpdate(
              { organisation: item.organisation },
              { $set: { quantity: existingBiogasEntry.quantity + item.quantity } }
            );
          } else {
            // Insert a new Biogasdb entry
            const newBiogasEntry = new Biogasdb({
              quantity: item.quantity,
              organisation: item.organisation,
            });
            await newBiogasEntry.save();
          }
        }
        // Remove expired food items from Fooddb
        const deleteResult = await Fooddb.deleteMany({
          _id: { $in: expiredFoodItems.map((item) => item._id) },
        });
    console.log(`${deleteResult.deletedCount} items removed from Fooddb.`);
  })
  .catch((err) => {
    console.error(err);
  });
  await Biogasdb.aggregate([
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: "$quantity" },
      },
    },
  ]).then((result) => {
    var biocount = result[0].totalQuantity;
    biocount = biocount * 0.03;
    statBoxData[0].count = biocount.toPrecision(3) + "m³";
  });
  req.session.errmsg = "";
  var isMobile = browserDetect(req.headers["user-agent"]).mobile;
  if (!isMobile) {
    res.render("desktop/index", {
      cdevmsg: HomePage.devtxt,
      titleTxt: HomePage.title_txt,
      descTxt: HomePage.desc_txt[[Math.floor(Math.random() * HomePage.desc_txt.length)]],
      emphasis: HomePage.emphasis_txt,
      obj: statBoxData,
      imgsrc: HomePage.aside_img[[Math.floor(Math.random() * HomePage.aside_img.length)]],
      isAdmin : req.session.isadminbool,
      login : req.session.isLoggedIn
    });
  } else {
    res.render("mobile/index", {
      cdevmsg: HomePage.devtxt,
      titleTxt: HomePage.title_txt,
      descTxt: HomePage.desc_txt[[Math.floor(Math.random() * HomePage.desc_txt.length)]],
      emphasis: HomePage.emphasis_txt,
      obj: statBoxData,
      imgsrc: HomePage.aside_img[[Math.floor(Math.random() * HomePage.aside_img.length)]],
      isAdmin : req.session.isadminbool,
      login : req.session.isLoggedIn
    });
  }
});

// Join page
app.get("/register", function (req, res) {
  var isMobile = browserDetect(req.headers["user-agent"]).mobile;
  if (isMobile) {
    res.render("mobile/register", { cdevmsg: devtxt, isAdmin: req.session.isadminbool,login : req.session.isLoggedIn });
  } else {
    res.render("desktop/register", { cdevmsg: devtxt, isAdmin: req.session.isadminbool,login : req.session.isLoggedIn });
  }
});

app.post("/newuser", async (req, res) => {
  var data = new Memberdb({
    name: req.body.name,
    orgname: req.body.orgname,
    email: req.body.email,
    password: md5(req.body.password),
    role: req.body.role,
    isAdmin : false
  });
  try {
    await data.save();
    if (data.role == "volunteer") {
      statBoxData[1].count++;
      res.render("desktop/success", { cdevmsg: devtxt,isAdmin: req.session.isadminbool,login : req.session.isLoggedIn });
    } else {
      statBoxData[2].count++;
      res.render("desktop/success", { cdevmsg: devtxt,isAdmin:req.session.isadminbool,login : req.session.isLoggedIn });
    }
  } catch (error) {
    console.log(error);
    res.render("desktop/failentry", { cdevmsg: devtxt,isAdmin:req.session.isadminbool,login : req.session.isLoggedIn });
  }
});

// Donate food
app.get("/donate-food", (req, res) => {
  req.session.redirecturl = "/donate-food";
  var isMobile = browserDetect(req.headers["user-agent"]).mobile;
  if(req.session.isLoggedIn)
  {
      if (isMobile) {
        res.render("mobile/donate_food", {
          cdevmsg: devtxt,
          loginState: req.session.isLoggedIn,
          errortxt: req.session.errmsg,
          isAdmin: req.session.isadminbool,
          login : req.session.isLoggedIn
        });
      }
      else {
      res.render("desktop/donate_food", {
        cdevmsg: devtxt,
        loginState: req.session.isLoggedIn,
        errortxt: req.session.errmsg,
        isAdmin: req.session.isadminbool,
        login : req.session.isLoggedIn
      });
      }
  }
  else{
    res.render("components/login",{isAdmin:req.session.isadminbool,errortxt:req.session.errmsg,login : req.session.isLoggedIn});
  }
  console.log(req.session);
});
app.post("/login", async (req, res) => {
  var lmail = req.body.email;
  var lpass = md5(req.body.password);
  try {
    var userLoggingIn = await Memberdb.findOne({ email: lmail });
    if (userLoggingIn) {
      if (userLoggingIn.password === lpass) {
        req.session.isLoggedIn = true;
        req.session.username = userLoggingIn.email;
        if(userLoggingIn.isAdmin)
        {
          console.log("its admin");
          req.session.isadminbool = true;
        }
        res.redirect(req.session.redirecturl);
      } else {
        req.session.errmsg = "Password incorrect";
        req.session.isLoggedIn = false;
        res.render("components/login",{isAdmin:req.session.isadminbool,errortxt:req.session.errmsg,login : req.session.isLoggedIn});
      }
    } else {
      req.session.errmsg = "No user found";
      req.session.isLoggedIn = false;
      res.render("components/login",{isAdmin:req.session.isadminbool,errortxt:req.session.errmsg,login : req.session.isLoggedIn});
    }
  } catch (error) {
    console.log(error);
  }
  console.log(req.session);
});
app.post("/addFood", async (req, res) => {
  var expirationTimestamp = new Date().getTime();
  var expirationTime = expirationTimestamp + req.body.expiry * 1000 * 60;
  var foodid = req.body.organisation + expirationTime;

  var data = new Fooddb({
    id: foodid,
    ftype: req.body.foodtype,
    quality: req.body.quality,
    quantity: parseInt(req.body.quantity),
    contact: req.body.contactnumber,
    organisation: req.body.organisation,
    expiry: expirationTime,
    message: req.body.custommessage,
  });

  try {
    await data.save();
    statBoxData[4].count = statBoxData[4].count + 1;
    res.redirect("/donate-food");
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while adding food entry.");
  }
});

// Request food
app.get("/request-food", async (req, res) => {
  req.session.redirecturl = "/request-food";
  if(req.session.isLoggedIn)
  {
    var availableFood = [];
    var availableFood = await Fooddb.find({});
    var isMobile = browserDetect(req.headers["user-agent"]).mobile;
    if (isMobile) {
      res.render("desktop/req_food", {
        cdevmsg: devtxt,
        loginState: req.session.isLoggedIn,
        errortxt: req.session.errmsg,
        data: availableFood,
        isAdmin: req.session.isadminbool,
        login : req.session.isLoggedIn
      });
    } else {
      res.render("desktop/req_food", {
        cdevmsg: devtxt,
        loginState: req.session.isLoggedIn,
        errortxt: req.session.errmsg,
        data: availableFood,
        isAdmin: req.session.isadminbool,
        login : req.session.isLoggedIn
      });
    }
  }
  else{
    res.render("components/login",{login : req.session.isLoggedIn,isAdmin:req.session.isadminbool,errortxt:req.session.errmsg});
  }
});

app.get("/statistics", (req, res) => {
  req.session.redirecturl = "/statistics";
  if(req.session.isLoggedIn)
  {
    var isMobile = browserDetect(req.headers["user-agent"]).mobile;
    if (isMobile) {
      res.render("desktop/stats", {
        loginState: req.session.isLoggedIn,
        errortxt: req.session.errmsg,
        cdevmsg: devtxt,
        predictionDone: false,
        predictionDone1: false,
        predictionDone2: false,
        year: curryear,
        isAdmin: req.session.isadminbool,
        login : req.session.isLoggedIn
      });
    } else {
      res.render("desktop/stats", {
        loginState: req.session.isLoggedIn,
        errortxt: req.session.errmsg,
        cdevmsg: devtxt,
        predictionDone: false,
        predictionDone1: false,
        predictionDone2: false,
        year: curryear,
        isAdmin: req.session.isadminbool,
        login : req.session.isLoggedIn
      });
    }
  }
  else{
    res.render("components/login",{login : req.session.isLoggedIn,isAdmin:req.session.isadminbool,errortxt:req.session.errmsg});
  }
});

app.get("/about", (req, res) => {
  req.session.redirecturl = "/about";
  var isMobile = browserDetect(req.headers["user-agent"]).mobile;
  if (isMobile) {
    res.render("mobile/about", { cdevmsg: devtxt, faq_obj: faq,isAdmin:req.session.isadminbool,login : req.session.isLoggedIn });
  } else {
    res.render("desktop/about", { cdevmsg: devtxt, faq_obj: faq,isAdmin:req.session.isadminbool,login : req.session.isLoggedIn });
  }
});

app.post("/callbiogasprediction", async (req, res) => {
  console.log("Predict button clicked!");
  var biogasqty = req.body.biogasqty;
  var url = "https://sathvik-biogas-predictor.onrender.com/getprediction";
  try {
    const response = await axios.post(url,{
      food_waste : parseFloat(biogasqty)
    });
    if (response.status != 200) {
      throw new Error("Error from Flask server");
    }

    var predictedData = await response.data;
    predictedData = parseFloat(predictedData.estimation);
    predictedData = predictedData / 10;
    predictedData = predictedData.toFixed(2);
    console.log(predictedData);
    // Send the data received from the Flask server as a response
    var isMobile = browserDetect(req.headers["user-agent"]).mobile;
    if (isMobile) {
      res.render("mobile/stats", {
        cdevmsg: devtxt,
        predictionDone: true,
        predicteddata: predictedData,
        biomass: biogasqty,
        predictionDone1: false,
        predictionDone2: false,
        year: curryear,
        loginState: req.session.isLoggedIn,
        errortxt: req.session.errmsg,
        isAdmin : req.session.isadminbool,
        login : req.session.isLoggedIn
      });
    } else {
      res.render("desktop/stats", {
        cdevmsg: devtxt,
        predictionDone: true,
        predicteddata: predictedData,
        biomass: biogasqty,
        predictionDone1: false,
        predictionDone2: false,
        year: curryear,
        loginState: req.session.isLoggedIn,
        errortxt: req.session.errmsg,
        isAdmin : req.session.isadminbool,
        login : req.session.isLoggedIn
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/gethungerstatsprediction", (req, res) => {
  var optselecteddata = req.body.dateRange;
  const currstatdata = {
    2023: "<iframe title='People who died from hunger' src='https://www.theworldcounts.com/embeds/counters/2?background_color=white&color=black&font_family=%22Helvetica+Neue%22%2C+Arial%2C+sans-serif&font_size=14' style='border: none' height='100' width='300'></iframe>",
    thisMonth:
      "<iframe title='People who died from hunger' src='https://www.theworldcounts.com/embeds/counters/2?background_color=white&color=black&font_family=%22Helvetica+Neue%22%2C+Arial%2C+sans-serif&font_size=14' style='border: none' height='100' width='300'></iframe>",
    thisWeek:
      "<iframe title='People who died from hunger' src='https://www.theworldcounts.com/embeds/counters/2?background_color=white&color=black&font_family=%22Helvetica+Neue%22%2C+Arial%2C+sans-serif&font_size=14' style='border: none' height='100' width='300'></iframe>",
    today:
      "<iframe title='People who died from hunger' src='https://www.theworldcounts.com/embeds/counters/2?background_color=white&color=black&font_family=%22Helvetica+Neue%22%2C+Arial%2C+sans-serif&font_size=14' style='border: none' height='100' width='300'></iframe>",
  };
  res.send(currstatdata[optselecteddata]);
});

app.post("/foodrequest", async (req, res) => {
  var qtyfood = await Fooddb.findOne({ id: req.body.cardid });
  res.redirect(req.get("referer"));
  console.log("Food purchased");
});

const admindata = [
  {
    title : "Add-Admin",
    desc : "You can add further admins who can monitor the HungerHelp's data of donors and etc!"
  },
  {
    title : "Top-Donors",
    desc : "Check the donors who contributed large amounts of services to the society through HungerHelp"
  },
  {
    title : "Review-Overview",
    desc : "Check the user's feedbacks based on their own UI/UX experiences!"
  }
]
app.get("/ad-tools",async(req,res)=>{
  req.session.redirecturl = "/ad-tools";
  const users = await Memberdb.find({});
  const feedbacks = await FeedbackDb.find({});
  if(req.session.isadminbool)
  {
    res.render("desktop/admintools",{isAdmin:req.session.isadminbool,adminCardData:admindata,users:users,login : req.session.isLoggedIn,feedbacks:feedbacks});
  }
  else{
    res.render("desktop/nofilefound",{isAdmin:req.session.isadminbool,login : req.session.isLoggedIn,feedbacks:feedbacks});
  }
});

app.post("/adminChange", async(req, res) => {
  const adminAction = await req.body['admin-submit-btn'];
  const selectedMails = await req.body["emails-list"];
  // console.log(selectedMails);
  if (adminAction === 'add') {
    try{
      const result = await Memberdb.updateMany({email:{"$in":selectedMails}},
      {isAdmin:true});
      console.log(result);
    }
    catch(error){
      console.log(error);
    }
  } else if (adminAction === 'remove') {
      try{
        const result = await Memberdb.updateMany({email:{"$in":selectedMails}},{isAdmin:false});
        console.log(result);
      }
      catch(error){
        console.log(error);
      }
  }

  // Send a response to the client
  res.redirect(req.get("referer"));
});

app.post("/getOrgData",async(req,res)=>{
  var selectedOrganisation = await req.body["org-list"];
  var cdata = await Fooddb.find({organisation:selectedOrganisation});
  const totalQuantity = cdata.reduce((sum, item) => sum + item.quantity, 0);
  var bdata = await Biogasdb.find({organisation:selectedOrganisation});
  var biodata = await Memberdb.find({orgname: selectedOrganisation});
  res.render("desktop/orgstat",{currdata:totalQuantity,biogasdata:bdata,orgname:selectedOrganisation,info:biodata,isAdmin:req.session.isadminbool,login : req.session.isLoggedIn});
});

app.listen(3000, () => {
  console.log("Running");
});

app.get("/logout",(req,res)=>{
  req.session.isLoggedIn = false;
  res.redirect(req.get("referer"));
});

app.get("/login",(req,res)=>{
  req.session.redirecturl = req.get("referer");
  res.render("components/login",{login : req.session.isLoggedIn,isAdmin:req.session.isadminbool,errortxt:req.session.errmsg});
});

app.post("/feedback",async(req,res)=>{
    var feeddata = await FeedbackDb({
      email : req.body.usermail,
      username : req.body.username,
      feedback : req.body.userfeedback
    });
    feeddata.save();
    res.redirect(req.get("referer"))
});
app.use((req, res, next) => {
  res.status(404).render("desktop/nofilefound",{isAdmin:req.session.isadminbool,login : req.session.isLoggedIn});
});