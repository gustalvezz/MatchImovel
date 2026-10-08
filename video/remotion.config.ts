import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Em ambientes sem acesso ao download do Chromium do Remotion (ex.: sandbox),
// aponte para um Chromium local via REMOTION_BROWSER_EXECUTABLE.
// No seu computador não é preciso definir nada.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
