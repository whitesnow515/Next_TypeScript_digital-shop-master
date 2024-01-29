import axios from "axios";

export const sellix_ = require("@sellix/node-sdk")(process.env.SELLIX_APIKEY, process.env.SELLIX_MERCHANT);
const CreateInvoice = async (price: number, currency: string, items:any,email:string) => {
    try {
        const products=items.filter((data:any)=>data.optionId)
        const paymentPayload = {
            title:"Kingjong",
            value: price,//price,
            currency: "USD",
            // product:products,
            email,
            white_label: false,
            return_url: "https//:www.google.com",
            gateway: currency
        };
        const payment = await sellix_.payments.create(paymentPayload);
    
  

        return payment;
    } catch (error) {
            
    }
}

const GetOrder=async (paymentId:string)=>{
    try{
      const order = await sellix_.orders.get(paymentId)
    return order
    } catch(err){
      console.error(err,"Error");
    } 

}


export const sellix = {
    createInvoice: CreateInvoice,
    getOrder:GetOrder
}