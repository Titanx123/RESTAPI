const express = require("express");
const {userModel,postModel} = require("./schema");
const app = express();
const salt = 10;
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();
const jwt = require("jsonwebtoken");



app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.listen(3002,(err)=>{
    if(!err){
        console.log("server is runing at 3002");
    }else{
        console.log(err);
    }
});

mongoose.connect("mongodb://localhost/assignment_5",()=>{
    console.log("connected to db");
},(err)=>{
    console.log(err);
})

app.post("/register",(req,res)=>{
    bcrypt.genSalt(salt,(err,hashSalt)=>{
        bcrypt.hash(req.body.password,hashSalt,(err,passwordHash)=>{
            userModel.create({name: req.body.name,email: req.body.email,password: passwordHash}).then((user)=>{
                res.status(200).send({"status":"succesfull","data": user});
            }).catch((err)=>{
                res.status(400).send(err);
            })
        })
    })
});

app.post("/login",(req,res)=>{
    userModel.find({email: req.body.email}).then((user)=>{
        if(user.length){
            bcrypt.compare(req.body.password,user[0].password).then((val)=>{
                if(val){
                    const authToken = jwt.sign(req.body.email,process.env.SECRET_KEY);
                    res.status(200).send({"status":"success","Token":authToken});
                }
            })
        }else{
            res.status(400).send("user not exixts");
        }
    })
});






app.post("/post",async (req,res)=>{
    if( await req.headers.authorization) {
        const  email = await jwt.verify(req.headers.authorization,process.env.SECRET_KEY);
        await postModel.create({body: req.body.body, image: req.body.image,title: req.body.title,user: email}).then((data)=>{
            res.status(200).send({"status":"post created","data":data});
        }).catch((err)=>{
            res.status(400).send("user not auth");
        })
    }
    else{
        res.status(400).send("missing token");
    }
});



app.get("/post",async (req,res)=>{
    if (await req.headers.authorization){
        const email = await jwt.verify(req.headers.authorization,process.env.SECRET_KEY);
        await postModel.find({user: email}).then((data)=>{
            res.status(200).send(data);
        }).catch((err)=>{
            res.status(400).send("user not auth");
        })
    }
    else{
        res.status(400).send("missing token");
    }
});


app.put("/post/:id",async (req,res)=>{
    // console.log(req.params);
    if( await req.headers.authorization){
        await postModel.find({_id: req.params.id}).then((post)=>{
            const email = jwt.verify(req.headers.authorization,process.env.SECRET_KEY);//authori=>{email,secretkey}=>verify(abcdefg,defg)=>abc
            if(post[0].user === email){
                postModel.updateOne({_id: req.params.id},{$set: req.body}).then((posts)=>{//
                    res.status(200).send({"status":"post updated"});
                }).catch((err)=>{
                    res.status(400).send("can't update");
                })
            }else{
                res.status(400).send("email in not valid");
            }
        }).catch((err)=>{
            res.status(400).send("id is not present");
        })
    }else{
        res.status(400).send("missing token");
    }
});


app.delete("/post/:id", async (req,res)=>{
    if(await req.headers.authorization){
        await postModel.find({_id: req.params.id}).then((post)=>{
            const email = jwt.verify(req.headers.authorization,process.env.SECRET_KEY);
            if(post[0].user === email){
                postModel.deleteOne({_id: req.params.id}).then(()=>{
                    res.status(200).send({"status":"Successfully deleted"});
                }).catch((err)=>{
                    res.status(400).send("can't delete");
                })
            }else{
                res.status(400).send("invalid email");
            }
        }).catch((err)=>{
            res.status(400).send("id is not present");
        })
    }else{
        res.status(400).send("mising token");
    }
});