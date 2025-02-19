const express = require('express');
const app = express();
const cors = require('cors');
const SSLCommerzPayment = require('sslcommerz-lts');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      'https://cuet-examflow.netlify.app'
    ],
    credentials: true,
  })
);
app.use(express.json())
const port = process.env.PORT || 5000;

const is_live = false

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a1obszd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const courseCollection = client.db("examflowDB").collection("courses");
    const examCollection = client.db("examflowDB").collection("exams");
    const orderCollection = client.db("examflowDB").collection("orders");
    const questionCollection = client.db("examflowDB").collection("questions");

    // courses related database
    app.get('/courses', async (req, res) => {
      const result = await courseCollection.find().toArray();
      res.send(result);
    })
    app.post('/courses', async (req, res) => {
      const course = req.body;
      const result = await courseCollection.insertOne(course);
      res.send(result);
    })

    // exam related database
    app.get('/exams', async (req, res) => {
      const result = await examCollection.find().toArray();
      res.send(result);
    })
    // exam related database
    app.get('/questions', async (req, res) => {
      const result = await questionCollection.find().toArray();
      res.send(result);
    })
    // Payment related API
    app.post('/create-payment', async (req, res) => {
      const paymentInfo = req.body;
      const { name, email, number } = paymentInfo
      const transaction_id = new ObjectId().toString();
      const data =
      {
        store_id: "jerse67932cc664172",
        store_passwd: "jerse67932cc664172@ssl",
        total_amount: 1470,
        currency: "BDT",
        tran_id: transaction_id,
        success_url: `https://cuet-examflow-server.vercel.app/success/${transaction_id}`,
        fail_url: `https://cuet-examflow-server.vercel.app/${transaction_id}`,
        cancel_url: 'http://localhost:3030/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        cus_name: name,
        cus_email: email,
        cus_add1: "CUET",
        cus_city: "Chittagong",
        cus_postcode: 3179,
        cus_country: "Bangladesh",
        cus_phone: number,
        shipping_method: "NO",
        product_name: "Fee",
        product_category: "Semester Fee",
        product_profile: "general",
      }
      const sslcz = new SSLCommerzPayment("jerse67932cc664172","jerse67932cc664172@ssl", is_live)
      sslcz.init(data).then(apiResponse => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        res.send({ url: GatewayPageURL })
        console.log('Redirecting to: ', GatewayPageURL)
      });
      const order = {
        name, email,number, transaction_id, paidStatus: false
      }
      const result = await orderCollection.insertOne(order)
    })
    app.post('/success/:tran_id', async (req, res) => {
      const tran_id = req.params.tran_id;
      console.log(tran_id);
      const result = await orderCollection.updateOne({ transaction_id: tran_id }, {
        $set:
        {
          paidStatus: true,
          deliveryStatus: "Pending"
        }
      })
      if (result.modifiedCount > 0) {
        res.redirect(`https://cuet-examflow.netlify.app/payment/success`)
      }
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
  res.send('CUET Examflow Server running');
})

app.listen(port, () => {
  console.log('CUET Examflow running on port,', port);
})