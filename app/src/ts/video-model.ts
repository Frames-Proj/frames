class Video {

    title: string;
    description: string;
    file: string; // TODO: verify that there isn't a filepath type
    owner: string;

    public getNumComments(): number {
        return 0;
    };

    public getComment(i:number): Promise<VideoComment> {
        return new Promise<VideoComment>(function ():void {
        });
    };

    public getNumReplyVideos(): number {
        return 0;
    };

    public getReplyVideo(i:number): Promise<Video> {
        return new Promise<Video>(function ():void {
        });
    };

}