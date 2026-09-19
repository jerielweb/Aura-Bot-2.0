import { profileTarget, sendProfilePreview } from "../../core/profileConfig.ts";

export default {
  name: ["profile", "perfil", "me"],
  description: "Muestra el perfil global.",
  category: "profile",
  async run(ctx: any) {
    const target = await profileTarget(ctx);
    return sendProfilePreview(ctx, target);
  },
};