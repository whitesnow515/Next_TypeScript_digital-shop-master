import requireLoggedIn, {getCurrentUser} from "@util/AuthUtils";
import {supportRoles} from "@util/Roles";
import getUserModel from "@models/user";
import {error} from "@util/log";
import {NextApiRequest, NextApiResponse} from "next";
import speakeasy from 'speakeasy'

const qrCode = require('qrcode')

const getQrCodeB64 = (otpauth_url: string )=> {
    return new Promise(resolve => {
        qrCode.toDataURL(otpauth_url, function(err: any, data_url: string) {
            if (err) return resolve('')
            // Display this data URL to the user in an <img> tag
            // Example:
            resolve(data_url);
        });
    })
}
export default async function TwoFactorAuth(req: NextApiRequest, res: NextApiResponse) {
    try {
        const token = await getCurrentUser(req, res);
        if (!token) {
            return;
        }
        if (req.method ==="POST") {
            const {code} = req.body;
            const UserModel = await getUserModel();
            const id = token._id;

            const user: any = await UserModel.findById(id);
            if (!user) {
                res.status(400).json({
                    success: false,
                    message: "Could not find user",
                });
                return;
            }
            if (!user.twofactor_secret){
                return res.json({
                    message: 'User has not initiated 2FA setup, cannot proceed.',
                    error: false
                })
            }
            if (user.twofactor_verified){
                return res.json({
                    message: 'Account already verified',
                    error: false
                })
            }
            const { base32: secret } = user.twofactor_secret;

            const verified = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token: code
            });

            if (verified) {

                // Update user data
                await UserModel.findByIdAndUpdate(id, {
                    twofactor_verified: true

                })

                return res.json({
                    verified: true
                })

            } else {
                return res.status(400).json({
                    verified: false
                })

            }
        }
        const UserModel = await getUserModel();
        const id = token._id;
        const data: any = await UserModel.findById(id);
        if (!data) {
            res.status(400).json({
                success: false,
                message: "Could not find user",
            });
            return;
        }
        if (!data.twofactor_secret) {
            const tempSecret:any = speakeasy.generateSecret()
            await UserModel.findByIdAndUpdate(id, {
                $set: {
                    twofactor_secret: tempSecret
                }
            })
            return  res.json({
                code: tempSecret.hex,
                url: await getQrCodeB64(tempSecret.otpauth_url)
            })
        }
        return  res.json({
            code: data.twofactor_secret.hex,
            url: await getQrCodeB64(data.twofactor_secret.otpauth_url)
        })

    } catch (e) {
        error(e);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
}