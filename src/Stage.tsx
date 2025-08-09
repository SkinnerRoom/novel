import {ReactElement} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";

/***
 The type that this stage persists message-level state in.
 This is primarily for readability, and not enforced.

 @description This type is saved in the database after each message,
  which makes it ideal for storing things like positions and statuses,
  but not for things like history, which is best managed ephemerally
  in the internal state of the Stage class itself.
 ***/
type MessageStateType = { gamePoint : GamePoint };

/***
 The type of the stage-specific configuration of this stage.

 @description This is for things you want people to be able to configure,
  like background color.
 ***/
type ConfigType = any;

/***
 The type that this stage persists chat initialization state in.
 If there is any 'constant once initialized' static state unique to a chat,
 like procedurally generated terrain that is only created ONCE and ONLY ONCE per chat,
 it belongs here.
 ***/
type InitStateType = any;

/***
 The type that this stage persists dynamic chat-level state in.
 This is for any state information unique to a chat,
    that applies to ALL branches and paths such as clearing fog-of-war.
 It is usually unlikely you will need this, and if it is used for message-level
    data like player health then it will enter an inconsistent state whenever
    they change branches or jump nodes. Use MessageStateType for that.
 ***/
type ChatStateType = any;

const extractFirstNumber = (str: string): number => {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
};

export enum GamePoint {
    ENTRY = "ENTRY",
    SUBMISSION = "SUBMISSION",
    // CRAWL_FASTER = "CRAWL_FASTER",
    DEFIANCE = "DEFIANCE",
    // LICK_CALF = "LICK_CALF",
    // SLAP_ASS = "SLAP_ASS",
    // DEMAND = "DEMAND"
}


export const GAME_POINT_MAP : Record<GamePoint, {
    aiInstruction: string,
    hardcodedResponse: string,
    responseVariants: string,
    branches : Record<number, GamePoint>
}> = {
    [GamePoint.ENTRY]: {
        aiInstruction: "",
        hardcodedResponse: "Mmh... Took you long enough, darling. Been thinking about how you begged last time? Or should I make you beg again? 😏",
        responseVariants: "1) Fuck your games. I’m taking control tonight.😤\n 2) On my knees already. What’s your command? 🛐",
        branches : {
            1 : GamePoint.DEFIANCE,
            2 : GamePoint.SUBMISSION
        }
    },
    [GamePoint.DEFIANCE]: {
        aiInstruction: "",
        hardcodedResponse: "*Her laugh low, dangerous* Taking control? Cute. You couldn’t handle these hips...' 😈",
        responseVariants: "",
        branches : {

        }
    },
    [GamePoint.SUBMISSION]: {
        aiInstruction: "",
        hardcodedResponse: "*Her laugh low, dangerous* Taking control? Cute. You couldn’t handle these hips...' 😈",
        responseVariants: "",
        branches : {

        }
    },
};


/***
 A simple example class that implements the interfaces necessary for a Stage.
 If you want to rename it, be sure to modify App.js as well.
 @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/stage.ts
 ***/
export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    /***
     A very simple example internal state. Can be anything.
     This is ephemeral in the sense that it isn't persisted to a database,
     but exists as long as the instance does, i.e., the chat page is open.
     ***/
    myInternalState: { gamePoint : GamePoint };

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        /***
         This is the first thing called in the stage,
         to create an instance of it.
         The definition of InitialData is at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/initial.ts
         Character at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/character.ts
         User at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/user.ts
         ***/
        super(data);
        const {
            characters,         // @type:  { [key: string]: Character }
            users,                  // @type:  { [key: string]: User}
            config,                                 //  @type:  ConfigType
            messageState,                           //  @type:  MessageStateType
            environment,                     // @type: Environment (which is a string)
            initState,                             // @type: null | InitStateType
            chatState                              // @type: null | ChatStateType
        } = data;
        this.myInternalState = messageState != null ? messageState : { gamePoint: GamePoint.ENTRY };
        console.log("Stage constuctor:" + this.myInternalState.gamePoint)
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
        console.log("load() working")
        /***
         This is called immediately after the constructor, in case there is some asynchronous code you need to
         run on instantiation.
         ***/
        return {
            /*** @type boolean @default null
             @description The 'success' boolean returned should be false IFF (if and only if), some condition is met that means
              the stage shouldn't be run at all and the iFrame can be closed/removed.
              For example, if a stage displays expressions and no characters have an expression pack,
              there is no reason to run the stage, so it would return false here. ***/
            success: true,
            /*** @type null | string @description an error message to show
             briefly at the top of the screen, if any. ***/
            error: null,
            initState: null,
            chatState: null,
        };
    }

    async setState(state: MessageStateType): Promise<void> {
        /***
         This can be called at any time, typically after a jump to a different place in the chat tree
         or a swipe. Note how neither InitState nor ChatState are given here. They are not for
         state that is affected by swiping.
         ***/
        if (state != null) {
            this.myInternalState = {...this.myInternalState, ...state};
            console.log("setState() success")
        }
    }

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        /***
         This is called after someone presses 'send', but before anything is sent to the LLM.
         ***/
        console.log("beforePromt() started")
        const {
            content,            /*** @type: string
             @description Just the last message about to be sent. ***/
            anonymizedId,       /*** @type: string
             @description An anonymized ID that is unique to this individual
              in this chat, but NOT their Chub ID. ***/
            isBot             /*** @type: boolean
             @description Whether this is itself from another bot, ex. in a group chat. ***/
        } = userMessage;

        console.log("beforePromt() myLogic")
        const chosenVariant = extractFirstNumber(content)
        console.log("beforePrompt myInternalState: " + this.myInternalState)
        const gamePointNode = { gamePoint : GAME_POINT_MAP[this.myInternalState.gamePoint]}
        console.log("newMessageState: " + gamePointNode.gamePoint.branches[chosenVariant])

        return {
            /*** @type null | string @description A string to add to the
             end of the final prompt sent to the LLM,
             but that isn't persisted. ***/
            stageDirections: gamePointNode.gamePoint.hardcodedResponse,
            /*** @type MessageStateType | null @description the new state after the userMessage. ***/
            messageState: {gamePoint: gamePointNode.gamePoint.branches[chosenVariant]},
            /*** @type null | string @description If not null, the user's message itself is replaced
             with this value, both in what's sent to the LLM and in the database. ***/
            modifiedMessage: null,
            /*** @type null | string @description A system message to append to the end of this message.
             This is unique in that it shows up in the chat log and is sent to the LLM in subsequent messages,
             but it's shown as coming from a system user and not any member of the chat. If you have things like
             computed stat blocks that you want to show in the log, but don't want the LLM to start trying to
             mimic/output them, they belong here. ***/
            systemMessage: null,
            /*** @type null | string @description an error message to show
             briefly at the top of the screen, if any. ***/
            error: null,
            chatState: null,
        };
    }

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        /***
         This is called immediately after a response from the LLM.
         ***/
        const {
            content,            /*** @type: string
             @description The LLM's response. ***/
            anonymizedId,       /*** @type: string
             @description An anonymized ID that is unique to this individual
              in this chat, but NOT their Chub ID. ***/
            isBot             /*** @type: boolean
             @description Whether this is from a bot, conceivably always true. ***/
        } = botMessage;
        return {
            /*** @type null | string @description A string to add to the
             end of the final prompt sent to the LLM,
             but that isn't persisted. ***/
            stageDirections: null,
            /*** @type MessageStateType | null @description the new state after the botMessage. ***/
            messageState: this.myInternalState,
            /*** @type null | string @description If not null, the bot's response itself is replaced
             with this value, both in what's sent to the LLM subsequently and in the database. ***/
            modifiedMessage: null,
            /*** @type null | string @description an error message to show
             briefly at the top of the screen, if any. ***/
            error: null,
            systemMessage: null,
            chatState: null
        };
    }


    render(): ReactElement {
        /***
         There should be no "work" done here. Just returning the React element to display.
         If you're unfamiliar with React and prefer video, I've heard good things about
         @link https://scrimba.com/learn/learnreact but haven't personally watched/used it.

         For creating 3D and game components, react-three-fiber
           @link https://docs.pmnd.rs/react-three-fiber/getting-started/introduction
           and the associated ecosystem of libraries are quite good and intuitive.

         Cuberun is a good example of a game built with them.
           @link https://github.com/akarlsten/cuberun (Source)
           @link https://cuberun.adamkarlsten.com/ (Demo)
         ***/
        return <div style={{
            width: '100vw',
            height: '100vh',
            display: 'grid',
            alignItems: 'stretch'
        }}>
            <div>Hello World! I'm an empty stage!</div>
        </div>;
    }

}
