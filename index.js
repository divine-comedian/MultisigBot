const { Client, Intents } = require('discord.js');
const { Safe } = require('@safe-global/protocol-kit');
const { getDefaultProvider } = require('ethers');

const DISCORD_BOT_TOKEN = 'MTA5OTgwNjg5ODE4Nzk0NDAzNw.GLG-kM.Bt9fekoNERjrGw6M2tUaoltkkdLlcc0ofhKd-w';
const RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/gnioHfdfPofs_tjR7-4zXDOWhhRcBRS5'; // Replace with your preferred Ethereum RPC URL

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.MESSAGE_CONTENT
] });

const ownerAliases = {
    "0xff75E131c711e4310C045317779d39B3B4f718C4" : "Giantkin#8403",
    "0x8132505BAeDbAa7320b8F2340F65976Edc0e8fBc" : "cuidadopeligro#4788",
    "0x839395e20bbB182fa440d08F850E6c7A8f6F0780" : "Griff (💜,💜)#8888",
    "0x00d18ca9782bE1CaEF611017c2Fbc1a39779A57C" : "mateodaza#3156",
    "0x5D28FE1e9F895464aab52287d85Ebff32B351674" : "Danibelle the Uno and Only#6791",
    "0xC46c67Bb7E84490D7EbdD0b8ecDaca68Cf3823F4" : "karmaticacid#1218",
    "0x826976d7C600d45FB8287CA1d7c76FC8eb732030" : "divine_comedian#5493",
    "0x05A1ff0a32bc24265BCB39499d0c5D9A6cb2011c" : "willyfox#1178",
    "0xed8DB37778804A913670d9367aAf4F043AAd938b" : "WhyldWanderer#7002",
    "0x2Ea846Dc38C6b6451909F1E7ff2bF613a96DC1F3" : "mohammad_ranjbar_z#2709",
    "0x701d0ECB3BA780De7b2b36789aEC4493A426010a" : "geleeroyale#3228",
    "0x6D97d65aDfF6771b31671443a6b9512104312d3D" : "markop#2007",
    "0x10a84b835C5df26f2A380B3E00bCC84A66cD2d34" : "Ramin#4479",
    "0xF23eA0b5F14afcbe532A1df273F7B233EBe41C78" : "Amin#2164",
    "0x38f80f8f76B1C44B2beeFB63bb561F570fb6ddB6" : "Freshelle"
  // Add more aliases here
};

async function getUnsignedOwners(safeAddress, network, nonce) {
    const provider = getDefaultProvider(network, { url: RPC_URL });
    const safe = await Safe.create({ provider, safeAddress });
  
    const threshold = safe.getThreshold();
    const owners = await safe.getOwners();
    const transaction = await safe.getTransactionByNonce(nonce);
  
    if (!transaction) {
      throw new Error(`No transaction found for nonce ${nonce}`);
    }
  
    const signatures = await safe.getSignatures(transaction);
    const signedOwners = signatures.map((signature) => signature.owner);
  
    const unsignedOwners = owners.filter((owner) => !signedOwners.includes(owner));
  
    return unsignedOwners.map((owner) => ownerAliases[owner] || owner);
  }
  

bot.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  if (content.startsWith('!checkunsigned')) {
    const [command, safeAddress, network, nonceStr] = content.split(' ');
    const nonce = parseInt(nonceStr, 10);

    if (isNaN(nonce) || !safeAddress || !network) {
      message.reply('Invalid command. Usage: !checkunsigned [safeAddress] [network] [nonce]');
      return;
    }

    try {
      const unsignedOwners = await getUnsignedOwners(safeAddress, network, nonce);
      message.reply(`Unsigned owners for nonce ${nonce}: ${unsignedOwners.join(', ')}`);
    } catch (error) {
      console.error(error);
      message.reply('Error fetching unsigned owners.');
    }
  } else if (content.startsWith('!massdm')) {
    const [command, safeAddress, network, nonceStr] = content.split(' ');
    const nonce = parseInt(nonceStr, 10);

    if (isNaN(nonce) || !safeAddress || !network || !message.member.permissions.has('ADMINISTRATOR')) {
      message.reply('Invalid command. Usage: !massdm [safeAddress] [network] [nonce]');
      return;
    }

    try {
      const unsignedOwners = await getUnsignedOwners(safeAddress, network, nonce);

      unsignedOwners.forEach(async (handle) => {
        const user = bot.users.cache.find((u) => u.username === handle);
        if (user) {
          await user.send(`You have not signed the transaction with nonce ${nonce} for the Gnosis Safe at ${safeAddress}. Please sign it.`);
        } else {
          console.warn(`User not found: ${handle}`);
        }
      });

      message.reply('Mass DM sent to unsigned owners.');
    } catch (error) {
      console.error(error);
      message.reply('Error sending mass DM.');
    }
  }
});

bot.login(DISCORD_BOT_TOKEN);
