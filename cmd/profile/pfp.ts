import {
  getProfilePictureUrl,
  profileTarget,
} from "../../core/profileConfig.ts";

export default {
  name: ["pfp", "foto"],
  description: "Muestra la foto y el perfil global.",
  category: "profile",
  async run(ctx: any) {
    const target = await profileTarget(ctx);
    const profileUrl = await getProfilePictureUrl(ctx.sock, target);
    return ctx.sock.sendMessage(
      ctx.from,
      { image: { url: profileUrl }, mentions: [target] },
      { quoted: ctx.msg },
    );
  },
};
