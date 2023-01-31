async function main() {
    console.log("deploying nft contract...");
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(
        "Crypto Devs",
        "CD",
        "0x204d0E513C657fdDF1e7FC0e097268C40bD7a4d0"); // whitelist contract: 0x204d0E513C657fdDF1e7FC0e097268C40bD7a4d0
    await nft.deployed();
    console.log(`Deployed: ${nft.address}`); // nft-contract: 0x5f106c84F473649Bf6F027c0bDf37D7C06225890
}

main().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
})