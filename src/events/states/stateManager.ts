import fs from 'fs';

export class StateFileManager {
    private readonly stateFilePath: string;
    constructor(private readonly coin: string) {
        this.stateFilePath = __dirname + '/' + this.coin + '.json';

        if (!fs.existsSync(this.stateFilePath)) {
            try {
                fs.writeFileSync(this.stateFilePath, JSON.stringify({}));
            } catch (error) {
                console.error('Error creating state file:', error);
            }
        }
    }

    public async loadStateFile(): Promise<any> {
        try {
            const data = await fs.promises.readFile(this.stateFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading state file:', error);
            return {};
        }
    }

    public async saveState(state?: any): Promise<void> {
        try {
            const currentState = await this.loadStateFile();
            const newState = { ...currentState, ...state };
            await fs.promises.writeFile(
                this.stateFilePath,
                JSON.stringify(newState, null, 4)
            );
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    public async clearStateFile(): Promise<void> {
        try {
            await fs.promises.writeFile(this.stateFilePath, JSON.stringify({}));
        } catch (error) {
            console.error('Error clearing state file:', error);
        }
    }
}
