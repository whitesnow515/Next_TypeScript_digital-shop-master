import { getSetting } from '@util/SettingsHelper';
import axios from 'axios';
import axiosProxy from 'axios-proxy-fix';
import { NextApiRequest, NextApiResponse } from 'next';

 
const SELLIX_API_URL = 'https://dev.sellix.io/v1/orders';

const getProxy =async () => {
  const defaultSellixProxies = await getSetting("sellixProxies", []);
  const randomIndex = Math.floor(Math.random() * defaultSellixProxies.length);
  const randomProxy = defaultSellixProxies[randomIndex];
  if(randomProxy){
    return {
      proxy: {
        host: randomProxy?.host,
        port: randomProxy?.port,
        auth: {
          username: randomProxy?.auth.username,
          password: randomProxy?.auth.password,
        },
      },
    };
  }
  return;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { orderId } = req.query;
    const proxy= await getProxy()
    const axiosWithProxy =proxy ? axiosProxy.create(proxy) : axios
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }
   
    const sellixResponse = await axiosWithProxy.get(`${SELLIX_API_URL}/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SELLIX_APIKEY}`,
        'User-Agent': req.headers['user-agent'],
      },
    });

   
    res.status(sellixResponse.status).json(sellixResponse.data);
  } catch (error) {
    console.error('Sellix API Proxy Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}