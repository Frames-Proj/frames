class VideoComment {
    
    owner: string;
    text: string;

    public getNumReplies(): number {
        return 0;
    };

    public getReply(i:number): Promise<VideoComment> {
        return new Promise<VideoComment>(function () : void {
        });
    };

}