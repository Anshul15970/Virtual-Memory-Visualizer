import { initPaging, nextStep, prevStep, togglePlay, resetPaging } from "./paging.js";
import { initDemand, dpNext, dpPrev, dpTogglePlay, resetDemand } from "./demand.js";
import { initSegments, addSegment, resetSegments, translateAddress } from "./segmentation.js";
import { showTab, initSpeedControl } from "./ui.js";
import { setSpeed } from "./paging.js";
import { runComparison, runBeladys } from "./comparison.js";

// expose to HTML
window.initPaging = initPaging;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.togglePlay = togglePlay;
window.resetPaging = resetPaging;

window.showTab = showTab;
initSpeedControl(setSpeed);

window.runComparison = runComparison;
window.runBeladys = runBeladys;

window.initDemand = initDemand;
window.dpNext = dpNext;
window.dpPrev = dpPrev;
window.dpTogglePlay = dpTogglePlay;
window.resetDemand = resetDemand;

window.addSegment = addSegment;
window.resetSegments = resetSegments;
window.translateAddress = translateAddress;

window.onload = () => {
  initSegments();
};