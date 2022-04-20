import { useEffect, useState } from "react";
import styled from "styled-components";
import confetti from "canvas-confetti";
import * as anchor from "@project-serum/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { GatewayProvider } from '@civic/solana-gateway-react';
import Countdown from "react-countdown";
import { Snackbar, Paper, LinearProgress, Chip } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { toDate, AlertState, getAtaForMint } from './utils';
import { MintButton } from './MintButton';
import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  CANDY_MACHINE_PROGRAM,
} from "./candy-machine";

const cluster = process.env.REACT_APP_SOLANA_NETWORK!.toString();
const decimals = process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS ? +process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS!.toString() : 9;
//const splTokenName = process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME ? process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME.toString() : "TOKEN";



const WalletContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
`;

const WalletAmount = styled.div`
  color: black;
  width: auto;
  padding: 5px 5px 5px 16px;
  min-width: 48px;
  min-height: auto;
  border-radius: 22px;
  background-color: var(--secondary-attribute-color);
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%), 0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  box-sizing: border-box;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 0;
  margin: 0;
  display: inline-flex;
  outline: 0;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;
`;

const Wallet = styled.ul`
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
`;

const ConnectButton = styled(WalletMultiButton)`
  border-radius: 18px !important;
  padding: 6px 16px;
  background-color: #4E44CE;
  margin: 0 auto;
`;

const NFT = styled(Paper)`
  padding: 5px 20px 20px 20px;
  flex: 1 1 auto;
  background-color: var(--card-background-color) !important;

`;
const Des = styled(NFT)`
  text-align: left;
  padding-top: 0px;
`;

const Card = styled(Paper)`
  display: inline-block;
  background-color: var(--card-background-lighter-color) !important;
  margin: 5px;
  padding: 24px;
`;

const MintButtonContainer = styled.div`
  font-color: white;
  button.MuiButton-contained:not(.MuiButton-containedPrimary).Mui-disabled {
    color: ##93d3fb;
  }

  button.MuiButton-contained:not(.MuiButton-containedPrimary):hover,
  button.MuiButton-contained:not(.MuiButton-containedPrimary):focus {
    -webkit-animation: pulse 1s;
    animation: pulse 1s;
    box-shadow: 0 0 0 2em rgba(255, 255, 255, 0);
  }

  @-webkit-keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 #93d3fb;
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 #93d3fb;
    }
  }
`;

const Logo = styled.div`
  flex: 0 0 auto;

  img {
    height: 120px;
  }
`;
const Menu = styled.ul`
  list-style: none;
  display: inline-flex;
  flex: 1 0 auto;

  li {
    margin: 0 25px;

    a {
      color: var(--main-text-color);
      list-style-image: none;
      list-style-position: outside;
      list-style-type: none;
      outline: none;
      text-decoration: none;
      text-size-adjust: 100%;
      touch-action: manipulation;
      transition: color 0.3s;
      padding-bottom: 15px;

      img {
        max-height: 26px;
      }
    }

    a:hover, a:active {
      color: rgb(131, 146, 161);
      border-bottom: 4px solid var(--title-text-color);
    }

  }
`;

const SolExplorerLink = styled.a`
  color: var(--main-text-color);
  border-bottom: 1px solid var(--title-text-color);
  font-weight: bold;
  list-style-image: none;
  list-style-position: outside;
  list-style-type: none;
  outline: none;
  text-decoration: none;
  text-size-adjust: 100%;

  :hover {
    border-bottom: 2px solid var(--title-text-color);
  }
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 4%;
  margin-left: 4%;
  text-align: center;
  justify-content: center;
`;

const MintContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 20px;
`;

const RowDesContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  gap: 20px;
`;

const ColumnDesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 20px;
`;

const Price = styled(Chip)`
  position: relative;
  margin: 5px;
  font-weight: bold;
  font-size: 1.5em !important;
`;

const Image = styled.img`
  height: 400px;
  width: auto;
  border-radius: 7px;
  
`;

const BorderLinearProgress = styled(LinearProgress)`
  margin: 20px 0;
  height: 10px !important;
  border-radius: 30px;
  border: 2px solid white;
  box-shadow: 5px 5px 40px 5px rgba(0,0,0,0.5);
  background-color:var(--card-background-color) !important;
  
  > div.MuiLinearProgress-barColorPrimary{
    background-color:var(--secondary-attribute-color) !important;
  }

  > div.MuiLinearProgress-bar1Determinate {
    border-radius: 30px !important;
    background-image: linear-gradient(270deg, rgba(255, 255, 255, 0.01), rgba(255, 255, 255, 0.5));
  }
`;

const ShimmerTitle = styled.h1`
  font-size: 3.5em;
  margin: 15px auto;
  text-transform: uppercase;
  animation: glow 2s ease-in-out infinite alternate;
  color: var(--main-text-color);
  @keyframes glow {
    from {
      text-shadow: 0 0 20px var(--main-text-color);
    }
    to {
      text-shadow: 0 0 30px var(--title-text-color), 0 0 10px var(--title-text-color);
    }
  }
`;

const LogoAligner = styled.div`
  display: flex;
  align-items: center;

  img {
    max-height: 35px;
    margin-right: 10px;
  }
`;

const RulesTitle = styled.h2`
  color: var(--list-title-text-color);
  text-align: center;
`;

const MenuItem = styled.li`
  font-size: 2em;
  color: var(--title-text-color);
  text-align: center;
  
`;

const MenuText = styled.p`
  font-size: 1.25em;
  color: var(--main-text-color);
  
`;

const OtherTixGallery = styled.div`
  margin: 5px;
  float: left;
  width: 24%;
`;

const OtherTixImage = styled.img`
  width: 100%;
  height: auto;
  cursor: pointer;
`;

const InactiveTixImage = styled.img`
  width: 100%;
  height: auto;
`;


export interface HomeProps {
  connection: anchor.web3.Connection;
  txTimeout: number;
  rpcHost: string;
}



const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
  const [isActive, setIsActive] = useState(false); // true when countdown completes or whitelisted
  const [solanaExplorerLink, setSolanaExplorerLink] = useState<string>("");
  const [itemsAvailable, setItemsAvailable] = useState(0);
  const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [payWithSplToken, setPayWithSplToken] = useState(false);
  const [price, setPrice] = useState(2500);
  const [priceLabel, setPriceLabel] = useState<string>("MILEZ");
  const [whitelistPrice, setWhitelistPrice] = useState(0);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [whitelistTokenBalance, setWhitelistTokenBalance] = useState(0);
  const [raffleTicket, setRaffleTicket] = useState<string>("Buy Jet-A Serum");
  const [raffleImage, setRaffleImage] = useState<string>("JetA.png");
  const [cmId, setcmID] = useState<string>(process.env.REACT_APP_CANDY_MACHINE_ID_SYRUM!);
  const [menuDesc, setMenuDesc] = useState<string>("After the mile high apes took over the plane,\n" +
    "they flew through the Bermuda Triangle. At this point it seems\n" +
    "like the new hybrid fuel caused a weird reaction with 3100 of\n" +
    "the apes on board, leading to some crazy mutations.");
  const [menuTitle, setMenuTitle] = useState<string>("Jet-A For Hijacked Apes");
  const [raffle, setRaffle] = useState<string>("SERUM");

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const rpcUrl = props.rpcHost;

  const refreshCandyMachineState = () => {
    (async () => {
      if (!wallet) return;

      const cndy = await getCandyMachineState(
        wallet as anchor.Wallet,
        new anchor.web3.PublicKey(cmId),
        props.connection
      );

      setCandyMachine(cndy);
      setItemsAvailable(cndy.state.itemsAvailable);
      setItemsRemaining(cndy.state.itemsRemaining);
      setItemsRedeemed(cndy.state.itemsRedeemed);

      var divider = 1;
      if (decimals) {
        divider = +('1' + new Array(decimals).join('0').slice() + '0');
      }

      // detect if using spl-token to mint
      if (cndy.state.tokenMint) {
        setPayWithSplToken(true);
        // Customize your SPL-TOKEN Label HERE
        // TODO: get spl-token metadata name
        setPriceLabel("$MILEZ");
        setPrice(cndy.state.price.toNumber() / divider);
        setWhitelistPrice(cndy.state.price.toNumber() / divider);
      } else {
        setPrice(cndy.state.price.toNumber() / LAMPORTS_PER_SOL);
        setWhitelistPrice(cndy.state.price.toNumber() / LAMPORTS_PER_SOL);
      }


      // fetch whitelist token balance
      if (cndy.state.whitelistMintSettings) {
        setWhitelistEnabled(true);
        if (cndy.state.whitelistMintSettings.discountPrice !== null && cndy.state.whitelistMintSettings.discountPrice !== cndy.state.price) {
          if (cndy.state.tokenMint) {
            setWhitelistPrice(cndy.state.whitelistMintSettings.discountPrice?.toNumber() / divider);
          } else {
            setWhitelistPrice(cndy.state.whitelistMintSettings.discountPrice?.toNumber() / LAMPORTS_PER_SOL);
          }
        }
        let balance = 0;
        try {
          const tokenBalance =
            await props.connection.getTokenAccountBalance(
              (
                await getAtaForMint(
                  cndy.state.whitelistMintSettings.mint,
                  wallet.publicKey,
                )
              )[0],
            );

          balance = tokenBalance?.value?.uiAmount || 0;
        } catch (e) {
          console.error(e);
          balance = 0;
        }
        setWhitelistTokenBalance(balance);
        setIsActive(balance > 0);
      } else {
        setWhitelistEnabled(false);
      }
    })();
  };

  const renderCounter = ({ days, hours, minutes, seconds }: any) => {
    return (
      <div><Card elevation={1}><h1>{days}</h1><br />Days</Card><Card elevation={1}><h1>{hours}</h1>
        <br />Hours</Card><Card elevation={1}><h1>{minutes}</h1><br />Mins</Card><Card elevation={1}>
          <h1>{seconds}</h1><br />Secs</Card></div>
    );
  };

  function displaySuccess(mintPublicKey: any): void {
    let remaining = itemsRemaining - 1;
    setItemsRemaining(remaining);
    setIsSoldOut(remaining === 0);
    if (whitelistTokenBalance && whitelistTokenBalance > 0) {
      let balance = whitelistTokenBalance - 1;
      setWhitelistTokenBalance(balance);
      setIsActive(balance > 0);
    }
    setItemsRedeemed(itemsRedeemed + 1);
    const solFeesEstimation = 0.012; // approx
    if (!payWithSplToken && balance && balance > 0) {
      setBalance(balance - (whitelistEnabled ? whitelistPrice : price) - solFeesEstimation);
    }
    setSolanaExplorerLink(cluster === "devnet" || cluster === "testnet"
      ? ("https://explorer.solana.com/address/" + mintPublicKey + "?cluster=" + cluster)
      : ("https://explorer.solana.com/address/" + mintPublicKey));
    throwConfetti();
  };

  function throwConfetti(): void {
    confetti({
      particleCount: 400,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  const onMint = async () => {
    try {
      setIsMinting(true);
      document.getElementById('#identity')?.click();
      if (wallet && candyMachine?.program && wallet.publicKey) {
        const mint = anchor.web3.Keypair.generate();
        const mintTxId = (
          await mintOneToken(candyMachine, wallet.publicKey, mint)
        )[0];

        let status: any = { err: true };
        if (mintTxId) {
          status = await awaitTransactionSignatureConfirmation(
            mintTxId,
            props.txTimeout,
            props.connection,
            'singleGossip',
            true,
          );
        }

        if (!status?.err) {
          setAlertState({
            open: true,
            message: 'Congratulations! Your purchase was successful!',
            severity: 'success',
          });

          // update front-end amounts
          displaySuccess(mint.publicKey);
        } else {
          setAlertState({
            open: true,
            message: 'Purchase failed! Please try again!',
            severity: 'error',
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || 'Purchasing failed! Please try again!';
      if (!error.msg) {
        if (!error.message) {
          message = 'Transaction Timeout! Please try again.';
        } else if (error.message.indexOf('0x138')) {
        } else if (error.message.indexOf('0x137')) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf('0x135')) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      setIsMinting(false);
    }
  };

  /*function GoAlienRaffle() {
    setcmID(process.env.REACT_APP_CANDY_MACHINE_ID_ALIEN_RAFFLE!);
    setRaffleTicket("Buy A 1/1 Alien Ape Ticket");
    setRaffleImage("/Raffles/Alien_Raffle.png");
    setMenuTitle("Raffle Sweepstakes")
    setMenuDesc("Raffle tickets can only be purchased using $MILEZ which are earned by staking your MHACs.\n" +
      "All winners will be chosen during a live stream after all tickets have been sold.\n" +
      "Buy a ticket, enjoy the ride, and may the odds be ever in your favor!");
    setPrice(500);
    setRaffle("TRUE");

  }*/

  /*function GoRobocockRaffle() {
    setcmID(process.env.REACT_APP_CANDY_MACHINE_ID_ROBOCOCK_RAFFLE!);
    setRaffleTicket("Buy A Robocock Ticket");
    setRaffleImage("/Raffles/Robocock_Raffle.png");
    setMenuTitle("Raffle Sweepstakes")
    setMenuDesc("Raffle tickets can only be purchased using $MILEZ which are earned by staking your MHACs.\n" +
      "All winners will be chosen during a live stream after all tickets have been sold.\n" +
      "Buy a ticket, enjoy the ride, and may the odds be ever in your favor!");
    setPrice(150);
    setRaffle("TRUE");

  }*/

  function GoApe2Raffle() {
    setcmID(process.env.REACT_APP_CANDY_MACHINE_ID_APE2_RAFFLE!);
    setRaffleTicket("Buy A MHAC Ape Ticket");
    setRaffleImage("/Raffles/Ape2_Raffle.png");
    setMenuTitle("Raffle Sweepstakes")
    setMenuDesc("Raffle tickets can only be purchased using $MILEZ which are earned by staking your MHACs.\n" +
      "All winners will be chosen during a live stream after all tickets have been sold.\n" +
      "Buy a ticket, enjoy the ride, and may the odds be ever in your favor!");
    setPrice(100);
    setRaffle("TRUE");

  }

  function GoApe3Raffle() {
    setcmID(process.env.REACT_APP_CANDY_MACHINE_ID_APE3_RAFFLE!);
    setRaffleTicket("Buy A MHAC Ape Ticket");
    setRaffleImage("/Raffles/Ape3_Raffle.png");
    setMenuTitle("Raffle Sweepstakes")
    setMenuDesc("Raffle tickets can only be purchased using $MILEZ which are earned by staking your MHACs.\n" +
      "All winners will be chosen during a live stream after all tickets have been sold.\n" +
      "Buy a ticket, enjoy the ride, and may the odds be ever in your favor!");
    setPrice(100);
    setRaffle("TRUE");

  }

  /*function GoSyrumRaffle() {
    setcmID(process.env.REACT_APP_CANDY_MACHINE_ID_SYRUM_RAFFLE!);
    setRaffleTicket("Buy A Jet-A Ticket");
    setRaffleImage("/Raffles/JetA_Raffle.png");
    setMenuTitle("Raffle Sweepstakes")
    setMenuDesc("Raffle tickets can only be purchased using $MILEZ which are earned by staking your MHACs.\n" +
      "All winners will be chosen during a live stream after all tickets have been sold.\n" +
      "Buy a ticket, enjoy the ride, and may the odds be ever in your favor!");
    setPrice(25);

  }*/



  function GoSyrum() {
    setcmID(process.env.REACT_APP_CANDY_MACHINE_ID_SYRUM!);
    setRaffleTicket("Buy A Jet-A Serum");
    setRaffleImage("JetA.png");
    setMenuTitle("Jet-A For Hijacked Apes")
    setMenuDesc("After the mile high apes took over the plane,\n" +
      "they flew through the Bermuda Triangle. At this point it seems\n" +
      "like the new hybrid fuel caused a weird reaction with 3100 of\n" +
      "the apes on board, leading to some crazy mutations.");
    setPrice(2500);
    setRaffle("SERUM");
  }


  function GoMilezCoupon() {
    setcmID(process.env.REACT_APP_CANDY_MACHINE_ID_MILEZ_COUPON!);
    setRaffleTicket("Buy A Milez Coupon");
    setRaffleImage("/Coupons/milez.png");
    setMenuTitle("Milez Coupon")
    setMenuDesc("These coupons were created to offer our ape holders a way to potentially sell their milez\n" +
      "and earn some income for working so hard staking their apes! These coupons will be available to be \n" +
      "resold on Magic Eden for whatever your heart desires! If you really like the picture, well then \n" +
      "you can just keep that too! Take this coupon, and send it to ADDRESS TBA to cash it in!\n\n" +
      "There are 25 clown coupons (worth 0 MILEZ), 500 worth 100 $MILEZ, 350 worth 250 $MILEZ, 100 worth 500 $MILEZ, and 25 worth 1000 $MILEZ!!!\n" +
      "By the way, if you do the math, you'll see its in your favor to play ;)");
    setPrice(200);
    setRaffle("COUPON");

  }




  useEffect(() => {
    (async () => {
      if (wallet) {
        //TODO
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(refreshCandyMachineState, [
    wallet,
    cmId,
    props.connection,
  ]);

  return (
    <main>
      <MainContainer>
        <WalletContainer>
          <Logo><a href="https://www.milehighapeclub.com" target="_blank" rel="noopener noreferrer"><img alt=""
            src="logo.png" /></a></Logo>
          <ShimmerTitle>Mile High Ape Club $MILEZ Store !</ShimmerTitle>

          <Wallet>
            {wallet ?
              <WalletAmount>$MILEZ<ConnectButton /></WalletAmount> :
              <ConnectButton>Connect Wallet</ConnectButton>}
          </Wallet>
          <Menu>
            <MenuItem><a style={{ cursor: "pointer" }} onClick={() => GoSyrum()}>Jet-A Syrum</a></MenuItem>
            <MenuItem><a style={{ cursor: "pointer" }} onClick={() => GoApe3Raffle()}>Raffles</a></MenuItem>
            <MenuItem><a style={{ cursor: "pointer" }} onClick={() => GoMilezCoupon()}>MILEZ Coupons</a></MenuItem>
          </Menu>
        </WalletContainer>
        <br />


        <MintContainer>
          <RowDesContainer>
            <NFT elevation={3}>
              <h2 style={{ fontSize: "2.5em" }}>{raffleTicket}</h2>
              <br />
              <Price label={isActive && whitelistEnabled && (whitelistTokenBalance > 0) ? (whitelistPrice + " " + priceLabel) : (price + " " + priceLabel)} />
              <div><Image
                src={raffleImage}
                alt="Ticket to Buy" /></div>
              <br />
              {wallet && isActive && whitelistEnabled && (whitelistTokenBalance > 0) &&
                <h3>You have {whitelistTokenBalance} whitelist mint(s) remaining.</h3>}
              {wallet && isActive &&
                <h3 style={{ color: "black" }}>TOTAL BOUGHT : {itemsRedeemed} / {itemsAvailable}</h3>}
              {wallet && isActive && <BorderLinearProgress variant="determinate"
                value={100 - (itemsRemaining * 100 / itemsAvailable)} />}
              <br />
              <MintButtonContainer>
                {!isActive && candyMachine?.state.goLiveDate ? (
                  <Countdown
                    date={toDate(candyMachine?.state.goLiveDate)}
                    onMount={({ completed }) => completed && setIsActive(true)}
                    onComplete={() => {
                      setIsActive(true);
                    }}
                    renderer={renderCounter}
                  />) : (
                  !wallet ? (
                    <ConnectButton>Connect Wallet</ConnectButton>
                  ) :
                    candyMachine?.state.gatekeeper &&
                      wallet.publicKey &&
                      wallet.signTransaction ? (
                      <GatewayProvider
                        wallet={{
                          publicKey:
                            wallet.publicKey ||
                            new PublicKey(CANDY_MACHINE_PROGRAM),
                          //@ts-ignore
                          signTransaction: wallet.signTransaction,
                        }}
                        // // Replace with following when added
                        // gatekeeperNetwork={candyMachine.state.gatekeeper_network}
                        gatekeeperNetwork={
                          candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                        } // This is the ignite (captcha) network
                        /// Don't need this for mainnet
                        clusterUrl={rpcUrl}
                        options={{ autoShowModal: false }}
                      >
                        <MintButton
                          candyMachine={candyMachine}
                          isMinting={isMinting}
                          isActive={isActive}
                          isSoldOut={isSoldOut}
                          onMint={onMint}
                        />
                      </GatewayProvider>
                    ) : (
                      <MintButton
                        candyMachine={candyMachine}
                        isMinting={isMinting}
                        isActive={isActive}
                        isSoldOut={isSoldOut}
                        onMint={onMint}
                      />
                    ))}
              </MintButtonContainer>
              <br />
              {wallet && isActive && solanaExplorerLink &&
                <SolExplorerLink href={solanaExplorerLink} target="_blank">View on Solana
                  Explorer</SolExplorerLink>}
            </NFT>
            <Des elevation={2}>
              <LogoAligner><RulesTitle>{menuTitle}</RulesTitle></LogoAligner>
              <MenuText>{menuDesc}</MenuText>
              <br></br>
              {raffle === "SERUM" &&
                <div>
                  <LogoAligner><RulesTitle>Hijacked Sneak Peaks</RulesTitle></LogoAligner>
                  <OtherTixGallery>
                    <InactiveTixImage src="/Hijacked/AngryCrayon.png" width="600" height="400"></InactiveTixImage>
                  </OtherTixGallery>
                  <OtherTixGallery>
                    <InactiveTixImage src="/Hijacked/DecomposedBanana.png" width="600" height="400"></InactiveTixImage>
                  </OtherTixGallery>
                  <OtherTixGallery>
                    <InactiveTixImage src="/Hijacked/EyeKnifeApe.png" width="600" height="400"></InactiveTixImage>
                  </OtherTixGallery>
                  <OtherTixGallery>
                    <InactiveTixImage src="/Hijacked/GrassyBrain.png" width="600" height="400"></InactiveTixImage>
                  </OtherTixGallery>
                </div>
              }
              {raffle === "TRUE" &&
                <div>
                  <LogoAligner><img src="" alt=""></img><RulesTitle>Active Raffles</RulesTitle></LogoAligner>
                
                  <OtherTixGallery style={{ width: "32%" }}>
                    <OtherTixImage src="/Raffles/Ape2_Raffle.png" width="600" height="400" onClick={() => GoApe2Raffle()}></OtherTixImage>
                    <h3 style={{color: "black", textAlign: "center"}}>ONE LUCKY WINNER (Click Here)</h3>
                    <OtherTixImage src="/Raffles/Ape3_Raffle.png" width="600" height="400" onClick={() => GoApe3Raffle()}></OtherTixImage>
                    <h3 style={{color: "black", textAlign: "center"}}>ONE LUCKY WINNER (Click Here)</h3>
                  </OtherTixGallery>
                  
                </div>
              }
              {raffle === "COUPON" &&
                <div>
                  <LogoAligner><RulesTitle>Potential Coupons</RulesTitle></LogoAligner>
                  <OtherTixGallery style={{ width: "19%" }}>
                    <InactiveTixImage src="/Coupons/clown.png" width="600" height="400"></InactiveTixImage>
                  </OtherTixGallery>
                  <OtherTixGallery style={{ width: "19%" }}>
                    <InactiveTixImage src="/Coupons/100_Milez.png" width="600" height="400"></InactiveTixImage>
                  </OtherTixGallery>
                  <OtherTixGallery style={{ width: "19%" }}>
                    <InactiveTixImage src="/Coupons/250_Milez.png" width="600" height="400"></InactiveTixImage>
                  </OtherTixGallery>
                  <OtherTixGallery style={{ width: "19%" }}>
                    <InactiveTixImage src="/Coupons/500_Milez.png" width="600" height="400"></InactiveTixImage>
                  </OtherTixGallery>
                  <OtherTixGallery style={{ width: "19%" }}>
                    <InactiveTixImage src="/Coupons/1000_Milez.png" width="600" height="400"></InactiveTixImage>
                  </OtherTixGallery>
                </div>
              }
            </Des>
          </RowDesContainer>
          {raffle === "TRUE" &&
            <ColumnDesContainer>
              <Des elevation={2}>
                <LogoAligner><img src="" alt=""></img><RulesTitle>Upcoming Raffles</RulesTitle></LogoAligner>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/Ape4_Raffle.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/Ape5_Raffle.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/Ape6_Raffle.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
              </Des>

              <Des elevation={2}>
                <LogoAligner><img src="" alt=""></img><RulesTitle>Past Raffles</RulesTitle></LogoAligner>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/Ape_Raffle.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/Robocock_Raffle.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/Cyborg_Iguana.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/Heavenland_Raffle.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/Alien_Raffle.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/JetA_Raffle.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/DazedDucks.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/Lux.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/BEST_BUDS.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/MHAC.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
                <OtherTixGallery>
                  <InactiveTixImage src="/Raffles/SOLANA.png" width="600" height="400"></InactiveTixImage>
                </OtherTixGallery>
              </Des>
            </ColumnDesContainer>
          }
        </MintContainer>
      </MainContainer>
      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default Home;
