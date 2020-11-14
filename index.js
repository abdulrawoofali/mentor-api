const express = require('express');
const mongoose = require('mongoose');

const app = express();

mongoose.connect('mongodb://localhost/mentor').then(()=>{console.log("connected to mongodb.....")}).catch((err)=>{console.log("error while connecting mongodb..,",err)});

const mentorSchema = new mongoose.Schema({
    name:String,
    company:String,
    contact:Number,
    email:String,
    aviailabilityHours: Number,
    mentee:[mongoose.SchemaTypes.ObjectId],
    sessions:[mongoose.SchemaTypes.ObjectId],
    remainingTime : Number,

})

const sessionSchema = new mongoose.Schema({
    menteeId : mongoose.SchemaTypes.ObjectId,
    mentorId :  mongoose.SchemaTypes.ObjectId,
    duration: Number
    //sessionStart : Date,
   // sessionEnd : Date
}) 

const menteeSchema = new mongoose.Schema({
    mentorId : mongoose.SchemaTypes.ObjectId,
    name:String,
    contact:Number,
    email:String

})

const availableMentorsSchema = new mongoose.Schema({
    mentorId :mongoose.SchemaTypes.ObjectId,
    availableTime : Number
})

const Mentor = mongoose.model('Mentor',mentorSchema);
const Mentee = mongoose.model('Mentee',menteeSchema);
const Session = mongoose.model('Session',sessionSchema);
const AvailableMentors = mongoose.model('AvailableMentors',availableMentorsSchema);

app.use(express.json());



app.get("/api/v1/session",(req,res)=>{

    Session.find().then(sessions=> res.send(sessions));
})

app.get("/api/v1/mentor/:name",(req,res)=>{
    const name = req.params.name;

    /*Mentor.find({name:{$tin: [new RegExp(name,"i")]}}).then( mentor => Mentee.find({_id:mentor.menteeId }).select('name')).then( mentee => res.send({
        mentorName : mentor.name,
        mentees: mentee
    }))*/

    Mentor.find({name: { $regex: '.*' + name + '.*' }}).then(mentor => res.send(mentor));
})


app.put("/api/v1/assignMentee/:id",(req,res)=>{
    const menteId = req.params.id;
    

   Mentor.find({mentee :{$size: 0}}).limit(1).then(mentor => {
        Mentee.find({_id: menteId}).then(mentee=> {
            if(mentee[0]["mentorId"] !== undefined){
                res.send("mentor alredy asingend...");
                return;
            }
            mentee[0].mentorId = mentor[0]._id;
            mentor[0].mentee.push(menteId);
            mentor[0].save();
            mentee[0].save().then(mentee => res.send(mentee));
        })
    })
    //Mentor.find({remainingTime:{$gte:0}}).limit(1).then(mentor => mentor.mentee.push(id), mentor.remainingTime = mentor.remainingTime-1, mentor.save() ).then(mentor => res.send(mentor));
});

app.post("/api/v1/addMentor",(req,res)=>{
    const mentor = new Mentor(req.body);
    mentor.save().then(mentor => {
        // creating a document for Available Mentors
        if(mentor.remainingTime > 0){
            availableMentors = new AvailableMentors({
                mentorId: mentor._id,
                availableTime: mentor.remainingTime,
            });
            availableMentors.save();
        }
        res.send(mentor);
    }
    )
})

app.post("/api/v1/addMentee",(req,res)=>{
    // add a mentee to db
    const mentee = new Mentee(req.body);

    mentee.save().then(mentee => res.send(mentee));

    /*AvailableMentors.find({availableTime:{$gte:0}}).limit(1).then(avlMentor => {
        mentee.mentorId = avlMentor[0].mentorId;
        let mentorName = "";
        console.log(mentee);
        mentee.save().then(mentee => {
            //console.log(mentee)
            Mentor.find({_id:mentee.mentorId}).then(mentor => {
                //console.log(mentor);
                mentor[0].mentee.push(mentee._id);
                mentor[0].save().then(res.send(
                    {MentorName :mentor[0].name ,
                    menteeName:mentee.name,
                    contact:mentee.contact,
                    email:mentee.email
                    })
                );
            }) 
        })
    });*/
   
    

})

app.put("/api/v1/scheduleSession/:meteeId/:mentorId/:dur",(req,res)=>{

    const menteeId = req.params.menteId;
    const mentorId = req.params.mentorId;
    const dur = req.params.dur;

    const sess = new Session({
        menteeId:menteeId,
        mentorId:mentorId,
        duration:dur
    });
    sess.save().then(sess =>{
        Mentor.find({_id:mentorId}).then(mtr => {
            mtr[0].sessions.push(sess._id);
            mtr[0].save().then(_ => res.send([sess,mtr]));
        })
     })


    

})



app.listen(3000, () => console.log('Listening'));
