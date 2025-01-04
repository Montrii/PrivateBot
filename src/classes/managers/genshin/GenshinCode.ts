export class GenshinCode {
    private server: string;
    private isSpecialCode: boolean = false;
    private items: string[] = [];
    private discovered: string;
    private valid: boolean | undefined;
    private link: string;
    private code: string | undefined;

    constructor(server: string, discovered: string, link: string) {
        this.server = server;
        this.discovered = discovered;
        this.link = link;
    }

    public getCode(): string | undefined {
        return this.code;
    }

    public setCode(code: string): void {
        this.code = code;
    }

    public setValid(valid: boolean): void {
        this.valid = valid;
    }

    public addItem(item: string): void {
        this.items.push(item);
    }

    public getServer(): string {
        return this.server;
    }

    public getItems(): string[] {
        return this.items;
    }

    public getDiscovered(): string {
        return this.discovered;
    }

    public getValid(): boolean | undefined {
        return this.valid;
    }

    public getLink(): string {
        return this.link;
    }

    public getIsSpecialCode(): boolean {
        return this.isSpecialCode;
    }

    public setIsSpecialCode(isSpecial: boolean = true): void {
        this.isSpecialCode = isSpecial;
    }
}
