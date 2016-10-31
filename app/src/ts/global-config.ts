

//
// Despite singletons usually being an anti-pattern, they are still useful
// for global *immutable* state which we need to initialize at some point.
//

export default class Config {
    // Contains global immutable state about our app. This is where we should stuff
    // all the config vars

    
    private static _instance:Config = new Config();

    constructor() {
        if(Config._instance){
            throw new Error("Error: Instantiation failed: Use Config.getInstance() instead of new.");
        }

        // Here is where we would parse an *rc file if we want to support
        // that in the future
        
        Config._instance = this;
    }

    getInstance(): Config { return Config._instance; }
    
    public readonly APP_HOME_DIR : string = "/tmp/wha-wha-home";
}
