import streamDeck from "@elgato/streamdeck";
import { PostHog } from "posthog-node";
import { GlobalSettings } from "../types/globalSettings";
import { PluginSecrets } from "../types/pluginSecrets";
import { AnalyticsEvent } from "../types/analytics/analyticsEvent";



async function isInitialLaunch(): Promise<boolean> {
    const settings = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
    if (settings.isInitialLaunch !== false) {
        const userId = settings.POSTHOG_USER_ID || crypto.randomUUID();

        await streamDeck.settings.setGlobalSettings<GlobalSettings>({ 
            ...settings, 
            isInitialLaunch: false,
            POSTHOG_USER_ID: userId
        });
        return true;
    }
    return false;
}



class Analytics {

    public static instance?: Analytics;


    public client: PostHog;
    public userId: string = "unknown";

    constructor(secret: string, host: string) {
        if (Analytics.instance) {
            Analytics.instance?.client.shutdown();
        }

        Analytics.instance = this;
        this.client = new PostHog(secret, { host });
    }
    
    public async startup(): Promise<void> {
        streamDeck.logger.info("Starting analytics");

        const initialLaunch = await isInitialLaunch();
        const { POSTHOG_USER_ID } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();

        if (this.isDevEnvironment()) {
            streamDeck.logger.info("Dev environment detected, using dev-user as userId!");
            this.userId = "dev-user";
        } else {
            this.userId = POSTHOG_USER_ID || crypto.randomUUID();
        }
        

        if (initialLaunch) {
            streamDeck.logger.info("Initial launch detected, sending analytics");
            this.client.capture({
                distinctId: this.userId,
                event: "plugin_installed",
            });
        }

        this.client.capture({
            distinctId: this.userId,
            event: "plugin_started",
        });
    }

    public async shutdown(): Promise<void> {
        streamDeck.logger.info("Shutting down analytics");
        await this.client.shutdown();
        streamDeck.logger.info("Analytics shut down!");
    }

    public isDevEnvironment(): boolean {
        return process.env.NODE_ENV === "development";
    }

    public sendEvent(event: AnalyticsEvent): void {
        if (this.isDevEnvironment()) {
            streamDeck.logger.info(`Dev environment detected, analytics event "${event.event}" not sent`);
            return;
        }

        this.client.capture({
            distinctId: this.userId,
            event: event.event,
            properties: event.properties,
        });
    }

}

async function createAnalytics(): Promise<Analytics | undefined> {
    const secrets = await streamDeck.system.getSecrets<PluginSecrets>();
    if (!secrets.POSTHOG_API_KEY || !secrets.POSTHOG_HOST) {
        streamDeck.logger.warn("Missing PostHog API key or host. Disabling analytics.");
        return undefined;
    }
    return new Analytics(
        secrets.POSTHOG_API_KEY,
        secrets.POSTHOG_HOST
    );
}

export { Analytics, createAnalytics };