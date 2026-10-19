import DefaultTheme from "vitepress/theme";
import { useRoute, type Theme } from "vitepress";
import { h, onMounted, watch } from "vue";
import { listenForKeys, revealActiveLesson } from "./keys.ts";
import { listenForZoom, makePicturesFocusable } from "./zoom.ts";
import { listenForResize, placeSideArrows } from "./side-arrows.ts";
import { reloadOnStaleBuild } from "./stale.ts";
import { listenForSnippetTaps } from "./concepts.ts";
import { listenForEyeTaps } from "./eye.ts";
import ConceptsToggle from "./ConceptsToggle.vue";
import BitPlaces from "./BitPlaces.vue";
import CompactNatural from "./CompactNatural.vue";
import TwoBytes from "./TwoBytes.vue";
import HexByte from "./HexByte.vue";
import BitsAndBytes from "./BitsAndBytes.vue";
import FixedWidth from "./FixedWidth.vue";
import VectorMap from "./VectorMap.vue";
import CoreBitfield from "./CoreBitfield.vue";
import AssuranceGrid from "./AssuranceGrid.vue";
import TrieBuilder from "./TrieBuilder.vue";
import StateKeyWeave from "./StateKeyWeave.vue";
import MountainBelt from "./MountainBelt.vue";
import VerdictVotes from "./VerdictVotes.vue";
import ReportLife from "./ReportLife.vue";
import GuarantorSeats from "./GuarantorSeats.vue";
import CheckpointRun from "./CheckpointRun.vue";
import ReadyQueue from "./ReadyQueue.vue";
import SafroleEpoch from "./SafroleEpoch.vue";
import AuthorizerPool from "./AuthorizerPool.vue";
import PvmStepper from "./PvmStepper.vue";
import PipelineCycles from "./PipelineCycles.vue";
import GasMeter from "./GasMeter.vue";
import ImportWaves from "./ImportWaves.vue";
import ResultTag from "./ResultTag.vue";
import ShardRebuild from "./ShardRebuild.vue";
import ShardJourney from "./ShardJourney.vue";
import CurveSolve from "./CurveSolve.vue";
import CryptoMap from "./CryptoMap.vue";
import JamNetwork from "./JamNetwork.vue";
import SlotPlayer from "./SlotPlayer.vue";
import StfStep from "./StfStep.vue";
import GrayPaperRefs from "./GrayPaperRefs.vue";
import GrayPaperMap from "./GrayPaperMap.vue";
import HashAvalanche from "./HashAvalanche.vue";
import ExtrinsicCommit from "./ExtrinsicCommit.vue";
import SignCheck from "./SignCheck.vue";
import HeaderMap from "./HeaderMap.vue";
import NumberKinds from "./NumberKinds.vue";
import ReaderWalk from "./ReaderWalk.vue";
import CodecPicker from "./CodecPicker.vue";
import RecordSwap from "./RecordSwap.vue";
import TraceShift from "./TraceShift.vue";
import VoteCount from "./VoteCount.vue";
import MaybeExactly from "./MaybeExactly.vue";
import BlockStrip from "./BlockStrip.vue";
import HashChain from "./HashChain.vue";
import ValidatorKeyMap from "./ValidatorKeyMap.vue";
import EpochTurn from "./EpochTurn.vue";
import ShuffleSteps from "./ShuffleSteps.vue";
import EntropyStairs from "./EntropyStairs.vue";
import Rotation from "./Rotation.vue";
import LotteryClose from "./LotteryClose.vue";
import OutsideIn from "./OutsideIn.vue";
import TicketRules from "./TicketRules.vue";
import SealCheck from "./SealCheck.vue";
import Offenders from "./Offenders.vue";
import RecentBlocks from "./RecentBlocks.vue";
import VerdictRules from "./VerdictRules.vue";
import FaultRule from "./FaultRule.vue";
import AssuranceRules from "./AssuranceRules.vue";
import GuaranteeWindow from "./GuaranteeWindow.vue";
import ReportAnchor from "./ReportAnchor.vue";
import ProvidePreimage from "./ProvidePreimage.vue";
import ServiceRecord from "./ServiceRecord.vue";
import Footprint from "./Footprint.vue";
import BlobLayers from "./BlobLayers.vue";
import DecodeInstruction from "./DecodeInstruction.vue";
import MemoryTouch from "./MemoryTouch.vue";
import StoreLoad from "./StoreLoad.vue";
import AluCorners from "./AluCorners.vue";
import CallTable from "./CallTable.vue";
import SignedBranches from "./SignedBranches.vue";
import BitCounts from "./BitCounts.vue";
import YLayout from "./YLayout.vue";
import SlotClock from "./SlotClock.vue";
import WorkPackage from "./WorkPackage.vue";
import WorkDigest from "./WorkDigest.vue";
import WorkReport from "./WorkReport.vue";
import BlockParcel from "./BlockParcel.vue";
import FallbackSealer from "./FallbackSealer.vue";
import VrfOutput from "./VrfOutput.vue";
import ClearCores from "./ClearCores.vue";
import SignedCounted from "./SignedCounted.vue";
import OntoCores from "./OntoCores.vue";
import CostRow from "./CostRow.vue";
import HostCall from "./HostCall.vue";
import FetchCopy from "./FetchCopy.vue";
import ProtocolConstants from "./ProtocolConstants.vue";
import GrowHeap from "./GrowHeap.vue";
import InfoView from "./InfoView.vue";
import WriteStore from "./WriteStore.vue";
import OperandParcel from "./OperandParcel.vue";
import RequestLife from "./RequestLife.vue";
import OneRound from "./OneRound.vue";
import TransferSend from "./TransferSend.vue";
import GiftRounds from "./GiftRounds.vue";
import AssignCore from "./AssignCore.vue";
import MergeRule from "./MergeRule.vue";
import EjectService from "./EjectService.vue";
import NewService from "./NewService.vue";
import BudgetRounds from "./BudgetRounds.vue";
import WellBalanced from "./WellBalanced.vue";
import ProvideRound from "./ProvideRound.vue";
import BlessOrder from "./BlessOrder.vue";
import EpochTallies from "./EpochTallies.vue";
import CoreLoad from "./CoreLoad.vue";
import WholeState from "./WholeState.vue";
import EntryKey from "./EntryKey.vue";
import ImportSteps from "./ImportSteps.vue";
import BetaDagger from "./BetaDagger.vue";
import SetOrder from "./SetOrder.vue";
import OogHeap from "./OogHeap.vue";
import PeerInfo from "./PeerInfo.vue";
import TargetStates from "./TargetStates.vue";
import AnchorWindow from "./AnchorWindow.vue";
import SessionPlay from "./SessionPlay.vue";
import TicketsPreimages from "./TicketsPreimages.vue";
import AssuranceParcel from "./AssuranceParcel.vue";
import GuaranteeParcel from "./GuaranteeParcel.vue";
import DisputesParcel from "./DisputesParcel.vue";
import CheckYourself from "./CheckYourself.vue";
import UnitText from "./UnitText.vue";
import PartFlow from "./PartFlow.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  // the concepts-only switch at the top of every lesson (concepts.ts)
  // at the top of every lesson: the concepts-only switch, and the Gray Paper sections it covers
  Layout: () => h(DefaultTheme.Layout, null, { "doc-before": () => [h(ConceptsToggle), h(GrayPaperRefs)] }),
  enhanceApp({ app, router }) {
    // the lessons' widgets, placed in a lesson as <HexByte /> and so on (WRITING.md, Interactive)
    app.component("PartFlow", PartFlow); // every Part's opening page
    app.component("HexByte", HexByte); // 1.1
    app.component("BitsAndBytes", BitsAndBytes); // 1.1
    app.component("FixedWidth", FixedWidth); // 2.1
    app.component("BitPlaces", BitPlaces); // 2.2
    app.component("TwoBytes", TwoBytes); // 2.2
    app.component("CompactNatural", CompactNatural); // 2.2
    app.component("VectorMap", VectorMap); // 2.6
    app.component("ResultTag", ResultTag); // 3.2
    app.component("ShardRebuild", ShardRebuild); // 3.3
    app.component("ShardJourney", ShardJourney); // 3.3
    app.component("CurveSolve", CurveSolve); // 3.3
    app.component("CryptoMap", CryptoMap); // the cryptography appendix
    app.component("JamNetwork", JamNetwork); // JAM at a glance
    app.component("SlotPlayer", SlotPlayer); // JAM at a glance
    app.component("StfStep", StfStep); // the start page
    app.component("GrayPaperMap", GrayPaperMap); // the Gray Paper map
    app.component("CoreBitfield", CoreBitfield); // 4.2
    app.component("SlotClock", SlotClock); // 0.4
    app.component("NumberKinds", NumberKinds); // 1.2
    app.component("ReaderWalk", ReaderWalk); // 2.3
    app.component("CodecPicker", CodecPicker); // 2.4
    app.component("RecordSwap", RecordSwap); // 2.5
    app.component("TraceShift", TraceShift); // 2.7
    app.component("VoteCount", VoteCount); // 4.4
    app.component("MaybeExactly", MaybeExactly); // 4.5
    app.component("BlockStrip", BlockStrip); // 4.7
    app.component("HashChain", HashChain); // 5.1
    app.component("ValidatorKeyMap", ValidatorKeyMap); // 6.3
    app.component("EpochTurn", EpochTurn); // 7.1
    app.component("ShuffleSteps", ShuffleSteps); // 7.2
    app.component("EntropyStairs", EntropyStairs); // 8.1
    app.component("Rotation", Rotation); // 8.2
    app.component("LotteryClose", LotteryClose); // 8.4
    app.component("OutsideIn", OutsideIn); // 8.4
    app.component("TicketRules", TicketRules); // 8.7
    app.component("SealCheck", SealCheck); // 8.9
    app.component("RecentBlocks", RecentBlocks); // 9.2
    app.component("Offenders", Offenders); // 10.2
    app.component("VerdictRules", VerdictRules); // 10.4
    app.component("FaultRule", FaultRule); // 10.5
    app.component("AssuranceRules", AssuranceRules); // 11.3
    app.component("GuaranteeWindow", GuaranteeWindow); // 12.4
    app.component("ReportAnchor", ReportAnchor); // 12.5
    app.component("ProvidePreimage", ProvidePreimage); // 14.1
    app.component("ServiceRecord", ServiceRecord); // 14.2
    app.component("Footprint", Footprint); // 14.2
    app.component("BlobLayers", BlobLayers); // 15.1
    app.component("DecodeInstruction", DecodeInstruction); // 15.2
    app.component("MemoryTouch", MemoryTouch); // 15.4
    app.component("StoreLoad", StoreLoad); // 15.4
    app.component("AluCorners", AluCorners); // 15.5
    app.component("SignedBranches", SignedBranches); // 15.6
    app.component("CallTable", CallTable); // 15.6
    app.component("BitCounts", BitCounts); // 15.7
    app.component("YLayout", YLayout); // 15.8
    app.component("WorkPackage", WorkPackage); // 3.1
    app.component("WorkDigest", WorkDigest); // 3.2
    app.component("WorkReport", WorkReport); // 3.3
    app.component("BlockParcel", BlockParcel); // Part 4
    app.component("FallbackSealer", FallbackSealer); // 8.3
    app.component("VrfOutput", VrfOutput); // 8.6
    app.component("ClearCores", ClearCores); // 10.3
    app.component("SignedCounted", SignedCounted); // 12.2
    app.component("OntoCores", OntoCores); // 12.3
    app.component("CostRow", CostRow); // 15.9
    app.component("HostCall", HostCall); // 16.1
    app.component("FetchCopy", FetchCopy); // 16.2
    app.component("ProtocolConstants", ProtocolConstants); // 16.2
    app.component("GrowHeap", GrowHeap); // 16.3
    app.component("InfoView", InfoView); // 16.4
    app.component("WriteStore", WriteStore); // 16.5
    app.component("OperandParcel", OperandParcel); // 16.7
    app.component("RequestLife", RequestLife); // 16.9
    app.component("OneRound", OneRound); // 17.1
    app.component("TransferSend", TransferSend); // 17.3
    app.component("GiftRounds", GiftRounds); // 17.4
    app.component("AssignCore", AssignCore); // 17.5
    app.component("MergeRule", MergeRule); // 17.6
    app.component("EjectService", EjectService); // 17.7
    app.component("NewService", NewService); // 17.8
    app.component("BudgetRounds", BudgetRounds); // 17.9
    app.component("WellBalanced", WellBalanced); // 17.11
    app.component("ProvideRound", ProvideRound); // 17.12
    app.component("BlessOrder", BlessOrder); // 17.13
    app.component("EpochTallies", EpochTallies); // 18.1
    app.component("CoreLoad", CoreLoad); // 18.2
    app.component("WholeState", WholeState); // 19.2
    app.component("EntryKey", EntryKey); // 19.3
    app.component("ImportSteps", ImportSteps); // 19.4
    app.component("BetaDagger", BetaDagger); // 19.5
    app.component("SetOrder", SetOrder); // 19.5
    app.component("OogHeap", OogHeap); // 19.6
    app.component("PeerInfo", PeerInfo); // 20.1
    app.component("TargetStates", TargetStates); // 20.2
    app.component("AnchorWindow", AnchorWindow); // 20.2
    app.component("SessionPlay", SessionPlay); // 20.3
    app.component("TicketsPreimages", TicketsPreimages); // 4.1
    app.component("AssuranceParcel", AssuranceParcel); // 4.2
    app.component("GuaranteeParcel", GuaranteeParcel); // 4.3
    app.component("DisputesParcel", DisputesParcel); // 4.4
    app.component("HeaderMap", HeaderMap); // 4.6
    app.component("HashAvalanche", HashAvalanche); // 5.1
    app.component("ExtrinsicCommit", ExtrinsicCommit); // 5.2
    app.component("SignCheck", SignCheck); // 5.3
    app.component("TrieBuilder", TrieBuilder); // 6.1
    app.component("StateKeyWeave", StateKeyWeave); // 6.2
    app.component("SafroleEpoch", SafroleEpoch); // 8.5
    app.component("MountainBelt", MountainBelt); // 9.1
    app.component("VerdictVotes", VerdictVotes); // 10.1
    app.component("AssuranceGrid", AssuranceGrid); // 11.1
    app.component("ReportLife", ReportLife); // 11.2
    app.component("GuarantorSeats", GuarantorSeats); // 12.1
    app.component("AuthorizerPool", AuthorizerPool); // 13.1
    app.component("PvmStepper", PvmStepper); // 15.3
    app.component("PipelineCycles", PipelineCycles); // 15.10
    app.component("GasMeter", GasMeter); // 15.11
    app.component("CheckpointRun", CheckpointRun); // 16.6
    app.component("ReadyQueue", ReadyQueue); // 17.2
    app.component("ImportWaves", ImportWaves); // 19.1
    // a lesson's understanding check, from its ::: check block (../checks.ts)
    app.component("CheckYourself", CheckYourself);
    app.component("UnitText", UnitText); // the widgets' sentences, their bits and bytes in colour (units.ts)
    if (typeof window === "undefined") return;
    reloadOnStaleBuild();
    listenForSnippetTaps();
    listenForEyeTaps();
    listenForKeys();
    listenForZoom();
    listenForResize();
    router.onAfterRouteChange = () => { revealActiveLesson(); };
  },
  setup() {
    const route = useRoute();
    onMounted(() => {
      revealActiveLesson();
      makePicturesFocusable();
      placeSideArrows();
    });
    // after each new page is in the DOM
    watch(() => route.path, () => {
      makePicturesFocusable();
      placeSideArrows();
    }, { flush: "post" });
  },
} satisfies Theme;
