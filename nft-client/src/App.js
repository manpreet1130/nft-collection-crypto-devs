import { useState, useEffect } from 'react';
import { ContractFactory, ethers } from 'ethers';
import { contractAddress, contractABI } from './constants';
import './App.css';

/*
	- connect to the wallet
		- if no metamask detected, tell the user to install the extension
	- owner
		- if hasn't started the presale, start it...
	- whitelister
		- if the presale is going on and hasn't minted, mint!
		- if the presale has ended, can still mint at regular price...
	- non-whitelister
		- if the presale is going on, can't mint, will get an error
		- public sale, mint if any tokens available or error
	- once the wallet has been connected, display 'Presale Mint' button if the presale is going on, else 'Public Mint'
	- show the current tokenId/max tokenId
*/



function App() {
	const [walletConnected, setWalletConnected] = useState(false);
	const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
	const [contract, setContract] = useState(null);
	const [isOwner, setIsOwner] = useState(false);
	const [presaleStarted, setPresaleStarted] = useState(false);
	const [presaleEnded, setPresaleEnded] = useState(false);
	const [totalMinted, setTotalMinted] = useState("0");
	const [loading, setLoading] = useState(false);
	const [alreadyMinted, setAlreadyMinted] = useState(false);
	const maxAvailable = 20;

	/**
	 * @dev used to check whether metamask is present and the correct
	 * network is chosen, in this case, goerli
	 */
	useEffect(() => {
		if(!window.ethereum) {
			window.alert("Metamask not detected...");
			throw new Error("Install metamask to connect...");
		}
		if(window.ethereum.chainId && window.ethereum.chainId.toString() !== "0x5") {
			window.alert("Switch to Goerli testnet");
		}
	}, []);

	/**
	 * @dev interval loops to fetch presale and total minted values at a fixed interval
	 */
	useEffect(() => {
		updateEthers();
		let checkPresaleInterval = null;
		let checkTotalMintedInterval = null;
		if(contract !== null) {
			checkPresaleInterval = setInterval(async () => {
				let _presaleStarted = await contract.presaleStarted();
				setPresaleStarted(_presaleStarted);
				if(_presaleStarted) {
					let _presaleEnded = await contract.presaleEndTime();
					if(_presaleEnded.lt(Math.floor(Date.now() / 1000))) {
						setPresaleEnded(true);
					}
				}
			}, 3 * 1000);

			checkTotalMintedInterval = setInterval(async () => {
				let _totalMinted = await contract.tokenId();
				setTotalMinted(_totalMinted.toString() - 1);
			}, 3 * 1000);
		}
		return () => {
			clearInterval(checkPresaleInterval);
			clearInterval(checkTotalMintedInterval);
		}; // cleanup
	}, [walletConnected]);

	// used to update provider, signer and contract on account switch
	window.ethereum.on("accountsChanged", updateEthers);

	// connecting wallet to page
	function connectWallet() {
		updateEthers();
		setWalletConnected(true);
	}

	/**
	 * @dev updating the provider, signer and contract values when required
	 */
	async function updateEthers() {
		let tempProvider = new ethers.providers.Web3Provider(window.ethereum, "goerli");
		setProvider(tempProvider);
		let tempSigner = tempProvider.getSigner();
		setSigner(tempSigner);
		let tempContract = new ethers.Contract(contractAddress, contractABI, tempSigner);
		setContract(tempContract);

		let contractOwner = await tempContract.owner();
		let currentAddress = await tempSigner.getAddress();


		if(currentAddress.toLowerCase() === contractOwner.toLowerCase()) {
			setIsOwner(true);
		}

		let hasMinted = await tempContract.ownerToTokenId(await tempSigner.getAddress());
		if(hasMinted.toString() === "1") {
			// setAlreadyMinted(true);
		}
	}

	/**
	 * @dev starts the presale, only callable by the owner
	 */
	async function startPresale() {
		console.log("starting presale...");
		setLoading(true);
		const tx = await contract.startPresale();
		await tx.wait();
		setLoading(false);
		console.log("presale started...");
		setPresaleStarted(true);
	}

	/**
	 * @dev presale mint, only for whitelisted addresses
	 */
	async function presaleMint() {
		console.log("minting in presale...");
		setLoading(true);
		const tx = await contract.presaleMint({
			value: ethers.utils.parseEther("0.05")
		});
		await tx.wait();
		setLoading(false);
		console.log("mint complete...");
		alreadyMinted(true);
	}

	/**
	 * @dev public mint, for everyone with enough eth
	 */
	async function publicMint() {
		console.log("minting with the public...");
		setLoading(true);
		const tx = await contract.mint({
			value: ethers.utils.parseEther("0.1")
		});
		await tx.wait();
		setLoading(false);
		console.log("mint completed...");
		alreadyMinted(true);
	}

	/**
	 * @returns the correct JSX for the situation at hand 
	 */
	function renderButton() {
		if(!walletConnected) {
			return <button className="button" onClick={connectWallet}> Connect Wallet </button>
		}
		if(totalMinted > maxAvailable) {
			return <div className="description"> Sold out! </div>
		}
		if(alreadyMinted) {
			return <div className="description"> Already Minted... </div>
		}
		if(isOwner && !presaleStarted) {
			return <button className="button" onClick={startPresale}> Start Presale </button>
		} 
		else if(!presaleStarted) {
			return <div className="description"> Presale has not started yet... </div>
		}
		if(presaleStarted && !presaleEnded) {
			return <button className="button" onClick={presaleMint}> Presale Mint! </button>
		} else if(presaleStarted && presaleEnded) {
			return <button className="button" onClick={publicMint}> Public Mint </button>
		}
	}

	return (
		<div className="main">
			<div>
				<div className="title">
					Crypto Devs NFT
				</div>
				<div className="description">
					NFT for the devs out there
				</div>
				{
					presaleStarted && <div className="description">
										{totalMinted}/20 so far!
									</div>	
				}	
				{loading ? <div className="description"> Loading... </div>
						: renderButton()}
			</div>
		</div>
	);
}

export default App;
