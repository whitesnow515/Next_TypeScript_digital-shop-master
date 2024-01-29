import requireLoggedIn, {getCurrentUser} from "@util/AuthUtils";
import {supportRoles} from "@util/Roles";
import getUserModel from "@models/user";
import {error} from "@util/log";
import {NextApiRequest, NextApiResponse} from "next";

 
export default async function TwoFactorAuthDisable(req: NextApiRequest, res: NextApiResponse) {
    try {
        const token = await getCurrentUser(req, res);
        if (!token) {
            return;
        }
        if (req.method ==="POST") {
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
                await UserModel.findByIdAndUpdate(id, {
                    twofactor_verified: false
                })
                return res.json({
                    message: 'Account is not verified now.',
                    error: false
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
        if (data.twofactor_secret) {
            await UserModel.findByIdAndUpdate(id, {
                $set: {
                    twofactor_secret: null
                }
            })
            return  res.json({
                message: "Successfulyy disabled",
                success: true
            })
        }
        return  res.json({
            message: "Successfulyy disabled",
            success: true
        })

    } catch (e) {
        error(e);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
}