/**
 * Delete all roles of the guild
 */
export async function clearRoles(guild: Guild) {
    guild.roles.cache
        .filter((role) => !role.managed && role.editable && role.id !== guild.id)
        .forEach((role) => {
            role.delete().catch(() => {});
        });
    return;
}
/**
 * Delete all channels of the guild
 */
export async function clearChannels(guild: Guild) {
    guild.channels.cache.forEach((channel) => {
        channel.delete().catch(() => {});
    });
    return;
}
/**
 * Delete all emojis of the guild
 */
export async function clearEmojis(guild: Guild) {
    guild.emojis.cache.forEach((emoji) => {
        emoji.delete().catch(() => {});
    });
    return;
}
/**
 * Delete all webhooks of the guild
 */
export async function clearWebhooks(guild: Guild) {
    const webhooks = await guild.fetchWebhooks();
    webhooks.forEach((webhook) => {
        webhook.delete().catch(() => {});
    });
    return;
}
/**
 * Delete all bans of the guild
 */
export async function clearBans(guild: Guild) {
    const bans = await guild.bans.fetch();
    bans.forEach((ban) => {
        guild.members.unban(ban.user).catch(() => {});
    });
    return;
}
/**
 * Delete all configuration of a guild
 */
export async function clearConfig(guild: Guild) {
    guild.setAFKChannel(null);
    guild.setAFKTimeout(60 * 5);
    guild.setIcon(null);
    guild.setBanner(null).catch(() => {});
    guild.setSplash(null).catch(() => {});
    guild.setDefaultMessageNotifications('ONLY_MENTIONS');
    guild.setWidgetSettings({
        enabled: false,
        channel: null
    });
    if (!guild.features.includes('COMMUNITY')) {
        guild.setExplicitContentFilter('DISABLED');
        guild.setVerificationLevel('NONE');
    }
    guild.setSystemChannel(null);
    guild.setSystemChannelFlags(['SUPPRESS_GUILD_REMINDER_NOTIFICATIONS', 'SUPPRESS_JOIN_NOTIFICATIONS', 'SUPPRESS_PREMIUM_SUBSCRIPTIONS']);
    return;
}
