import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import * as s from "./styles/globalStyles";
import styled from "styled-components";

const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')


const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

export const StyledButton = styled.button`
  padding: 20px;
  border-radius: 50px;
  border: none;
  font-size: 20px;
  background: rgb(184,185,241);
  background: linear-gradient(85deg, #00e0ac, #07f 50%, #ff1654);
  //background-color: var(--secondary);
  padding: 20px;
  font-weight: 800;
  color: var(--secondary-text);
  width: 300px;
  cursor: pointer;
  box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;

export const StyledRoundButton = styled.button`
  padding: 10px;
  border-radius: 100%;
  border: none;
  background-color: var(--primary);
  padding: 10px;
  font-weight: bold;
  font-size: 15px;
  color: var(--primary-text);
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;

export const ResponsiveWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: stretched;
  align-items: stretched;
  width: 95%;
  @media (min-width: 767px) {
    width: 90%;
  }
  @media (min-width: 1000px) {
    width: 75%;
  }

  @media (min-width: 1600px) {
    width: 1200px;
  }
`;

export const StyledLogo = styled.img`
  height: 50px;
  @media (min-width: 767px) {
    height: 50px;
  }
  transition: width 0.5s;
  transition: height 0.5s;
`;

export const StyledImg = styled.img`
  border: 0px dashed var(--secondary);
  background-color: var(--accent);
  border-radius: 100%;
  width: 180px;
  @media (min-width: 800px) {
    width: 200px;
  }
  @media (min-width: 1000px) {
    width: 250px;
  }
  transition: width 0.5s;
`;

export const StyledLink = styled.a`
  color: var(--secondary);
  text-decoration: none;
`;

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [feedback, setFeedback] = useState(`Click mint to claim your NFT.`);
  const [mintAmount, setMintAmount] = useState(1);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
    ALLOW_LIST: []
  });

  /** Mint function to claim NFT from Contract*/
  const claimNFTs = async () => {
    let cost = CONFIG.WEI_COST;
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);

    // Construct merkle proof to validate allowlist eligibility
    let accounts = await ethereum.request({ method: "eth_requestAccounts" });
    let address = accounts[0]
    let merkleProof = merkleTree.getHexProof(keccak256(address));

    console.log("Cost: ", totalCostWei);
    console.log("Gas limit: ", totalGasLimit);
    console.log("Minting address: ", address);

    setFeedback(`Please confirm your transaction in Metamask 🦊 and wait for mint to process. This might take a few seconds ⏱.`);
    setClaimingNft(true);

    // front-end check if on allowlist so that no (failed) txn will be send if not
    // address will be returned in lower case, hence, cast allowlist
    let allowListlower = CONFIG.ALLOW_LIST.map(element => {
      return element.toLowerCase();
    });

    if (allowListlower.includes(address)) {

      blockchain.web3.eth.getGasPrice()
        .then(gasPrice => {
          blockchain.smartContract.methods
            .claim(merkleProof)
            .send({
              gasLimit: String(totalGasLimit),
              gasPrice: gasPrice * 1.1, // set gas 10% higher just to be sure
              to: CONFIG.CONTRACT_ADDRESS,
              from: blockchain.account,
              value: totalCostWei,
            })
            .once("error", (err) => {
              console.log(err);
              setFeedback("❌ Sorry, something went wrong.");
              setClaimingNft(false);
            })
            .then((receipt) => {
              console.log(receipt);
              setFeedback(
                `🎉 Congratulation 🎉 \n Your ${CONFIG.NFT_NAME} has been minted!`
              );
              setClaimingNft(false);
              dispatch(fetchData(blockchain.account));
            });
        });
    } else {
      // setFeedback("Sorry, it seems like you are not on the allowlist.");
      setFeedback(`⚠️ Sorry it seems like you are not on the allowlist.`);
      setClaimingNft(false);
    }
  };

  const getData = () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  // build merkle tree for whitelisting
  const allowList = CONFIG.ALLOW_LIST;
  const leafNodes = allowList.map(addr => keccak256(addr));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  const merkleRoot = merkleTree.getRoot();

  return (
    <s.Screen>
      <s.Container
        flex={1}
        ai={"center"}
        style={{
          padding: 24,
          //background: "linear-gradient(to bottom , rgba(184,185,241,1), rgba(233,141,216,1))"
          // backgroundColor: "var(--primary)" 
        }}
        image={CONFIG.SHOW_BACKGROUND ? "/config/images/bg.png" : null}
      >
        <StyledLogo alt={"logo"} src={"/config/images/logo.png"} />
        <ResponsiveWrapper flex={1} style={{ padding: 24 }} test>
          <s.SpacerLarge />
          <s.Container
            flex={2}
            jc={"center"}
            ai={"center"}
            style={{
              backgroundColor: "var(--accent)",
              padding: "30px 60px 30px 60px",
              borderRadius: 24,
              border: "0px var(--secondary)",
              boxShadow: "18px 25px 73px rgba(0,0,0,0.41)",
            }}
          >
            <s.Container jc={"center"} ai={"center"}>
              <StyledImg alt={"W3B OG Token"} src={"/config/images/pretzel_token_preview.gif"} />
            </s.Container>
            <s.SpacerMedium />
            <s.TextTitle
              style={{
                textAlign: "center",
                fontSize: 25,
                fontWeight: "bold",
                color: "var(--accent-text)",
              }}
            >
              PretzelDAO
            </s.TextTitle>
            <s.TextTitle
              style={{
                textAlign: "center",
                fontSize: 50,
                fontWeight: "bold",
                color: "var(--accent-text)",
              }}
            >
              Active Member Badge
            </s.TextTitle>
            <s.SpacerMedium />
            <s.TextDescription
              style={{
                textAlign: "center",
                color: "var(--accent-text)",
              }}
            >
              We are PretzelDAO – a community of builders baked in Munich at home in Web3.
              As an active member of our DAO you can claim your active member badge which acts as a governance token for our community.
              Please make sure that you have submitted your wallet address in our Discord. Be there or be square.
            </s.TextDescription>
            <s.SpacerXSmall />
            <s.TextDescription
              style={{
                textAlign: "center",
                color: "var(--accent-text)",
              }}
            >
              LFB!
            </s.TextDescription>
            <s.SpacerLarge />
            <s.TextSubTitle
              style={{ textAlign: "center", color: "var(--accent-text)" }}
            >
              Mint your Active Member Badge on {CONFIG.NETWORK.NAME}.
            </s.TextSubTitle>
            <s.SpacerSmall />
            <s.TextTitle
              style={{
                textAlign: "center",
                fontSize: 30,
                color: "var(--accent-text)",
              }}
            >
              {data.totalSupply} / (🥨,🥨) minted
            </s.TextTitle>
            <s.TextDescription
              style={{
                textAlign: "center",
                color: "var(--accent-text)",
              }}
            >
              (mint counter will refresh after connecting your wallet)
            </s.TextDescription>
            <s.SpacerXSmall />
            {/* Case collection is sold-out */}
            {Number(data.totalSupply) >= CONFIG.MAX_SUPPLY ? (
              <>
                <s.TextDescription
                  style={{
                    textAlign: "center",
                    color: "var(--accent-text)",
                    backgroundColor: "rgb(230, 247, 255)",
                    padding: "15px 20px 15px 20px",
                    borderRadius: 10
                  }}
                >
                  ℹ️ Unfortunately, all Active Member Badges have been claimed. {"\n"}
                  Stay tuned for future token drops.
                </s.TextDescription>
                <s.SpacerXSmall />

                <s.SpacerSmall />
              </>
            ) : (
              <>
                <s.SpacerXSmall />
                <s.SpacerSmall />
                {/* Case User new on page and not connected via metamask yet*/}
                {blockchain.account === "" ||
                  blockchain.smartContract === null ? (
                  <s.Container ai={"center"} jc={"center"}>
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--accent-text)",
                      }}
                    >
                      Please make sure you are connected to the right network (
                      {CONFIG.NETWORK.NAME}) and the correct address.
                    </s.TextDescription>
                    <s.SpacerSmall />
                    <StyledLink target={"_blank"} href={CONFIG.SCAN_LINK}>
                      {truncate(CONFIG.CONTRACT_ADDRESS, 64)}
                    </StyledLink>
                    <s.SpacerSmall />
                    <StyledButton
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(connect());
                        getData();
                      }}
                    >
                      CONNECT WALLET
                    </StyledButton>
                    <s.SpacerSmall />
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--primary-text)",
                      }}
                    >
                    </s.TextDescription>
                    {blockchain.errorMsg !== "" ? (
                      <>
                        <s.SpacerSmall />
                        <s.TextDescription
                          style={{
                            backgroundColor: "rgb(255, 230, 230)",
                            padding: "10px 20px 10px 20px",
                            borderRadius: 10,
                            textAlign: "center",
                            color: "var(--accent-text)",
                          }}
                        >
                          ⚠️ {blockchain.errorMsg}
                        </s.TextDescription>
                      </>
                    ) : null}
                  </s.Container>
                ) : (
                  <>
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--accent-text)",
                      }}
                    >
                      {feedback}
                    </s.TextDescription>
                    <s.SpacerMedium />
                    <s.SpacerSmall />
                    <s.Container ai={"center"} jc={"center"} fd={"row"}>
                      <StyledButton
                        disabled={claimingNft ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          claimNFTs();
                          getData();
                        }}
                      >
                        {claimingNft ? "🛠 Minting in Progress 🛠" : "MINT YOUR NFT"}
                      </StyledButton>
                    </s.Container>
                  </>
                )}
              </>
            )}
            <s.SpacerMedium />
          </s.Container>
          <s.SpacerLarge />
        </ResponsiveWrapper>
        <s.SpacerMedium />
        <s.Container jc={"center"} ai={"center"} style={{ width: "70%" }}>
          <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
            }}
          >
            Made with ❤️ in Munich.
          </s.TextDescription>
          <s.SpacerSmall />

        </s.Container>
      </s.Container>
    </s.Screen>
  );
}

export default App;
