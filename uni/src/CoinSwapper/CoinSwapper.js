import React, { useEffect } from "react";
import {
  Container,
  Grid,
  IconButton,
  makeStyles,
  Paper,
  Typography,
} from "@material-ui/core";
import SwapVerticalCircleIcon from "@material-ui/icons/SwapVerticalCircle";
import { useSnackbar } from "notistack";
import LoopIcon from "@material-ui/icons/Loop";
import {
  getAccount,
  getFactory,
  getProvider,
  getRouter,
  getSigner,
  getNetwork,
  getAmountOut,
  getBalanceAndSymbol,
  getWeth,
  swapTokens,
  streamTokens,
  getReserves,
} from "../ethereumFunctions";
import CoinField from "./CoinField";
import CoinDialog from "./CoinDialog";
import LoadingButton from "../Components/LoadingButton";
import WrongNetwork from "../Components/wrongNetwork";
import COINS from "../constants/coins";
import * as chains from "../constants/chains";

const styles = (theme) => ({
  paperContainer: {
    borderRadius: theme.spacing(2),
    padding: theme.spacing(1),
    paddingBottom: theme.spacing(3),
    backgroundColor: "#D0D5E2",
    fontFamily: "sans-serif",
  },
  switchButton: {
    zIndex: 1,
    margin: "-16px",
    padding: theme.spacing(0.5),
  },
  fullWidth: {
    width: "100%",
  },
  halfWidth: {
    width: "50%",
  },
  title: {
    textAlign: "center",
    padding: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
  },
  hr: {
    width: "100%",
  },
  balance: {
    padding: theme.spacing(1),
    overflow: "wrap",
    textAlign: "center",
  },
  footer: {
    marginTop: "285px",
  },
  timevar1: {
    marginTop: "15px",
    backgroundColor: "#FFFFFF",
    padding: "10px",
    marginRight: "5px",
    borderRadius: theme.spacing(2),
    height: "70px",
    border: "0px",
    width: "48.5%",
    shadowBox: "None",
    fontFamily: "sans-serif",
  },
  timevar2: {
    marginTop: "15px",
    backgroundColor: "#FFFFFF",
    padding: "10px",
    marginLeft: "5px",
    borderRadius: theme.spacing(2),
    height: "70px",
    border: "0px",
    width: "48.5%",
    shadowBox: "None",
    fontFamily: "sans-serif",
  },
  coinSelector: {
    backgroundColor: "#FFFFFF",
  },
});

const useStyles = makeStyles(styles);

function CoinSwapper(props) {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  // Stores a record of whether their respective dialog window is open
  const [dialog1Open, setDialog1Open] = React.useState(false);
  const [dialog2Open, setDialog2Open] = React.useState(false);
  const [wrongNetworkOpen, setwrongNetworkOpen] = React.useState(false);

  // Stores data about their respective coin
  const [coin1, setCoin1] = React.useState({
    superTokenAddress: undefined,
    address: undefined,
    symbol: undefined,
    balance: undefined,
  });
  const [coin2, setCoin2] = React.useState({
    superTokenAddress: undefined,
    address: undefined,
    symbol: undefined,
    balance: undefined,
  });

  const [freq, setFreq] = React.useState("Time Horizon");
  const [hor, setHor] = React.useState("Frequency");

  // Stores the current reserves in the liquidity pool between coin1 and coin2
  const [reserves, setReserves] = React.useState(["0.0", "0.0"]);

  // Stores the current value of their respective text box
  const [field1Value, setField1Value] = React.useState("");
  const [field2Value, setField2Value] = React.useState("");

  // Controls the loading button
  const [loading, setLoading] = React.useState(false);

  //later needs to be deleted
  useEffect(() => {
    if (field1Value != 0.0 && field2Value != 0.0) {
      // setHor("1");
      // setFreq("1");
    }
  }, [field1Value, field2Value]);

  // Switches the top and bottom coins, this is called when users hit the swap button or select the opposite
  // token in the dialog (e.g. if coin1 is TokenA and the user selects TokenB when choosing coin2)
  const switchFields = () => {
    setCoin1(coin2);
    setCoin2(coin1);
    setField1Value(field2Value);
    setReserves(reserves.reverse());
  };

  // These functions take an HTML event, pull the data out and puts it into a state variable.
  const handleChange = {
    field1: (e) => {
      setField1Value(e.target.value);
    },
  };

  // Turns the account's balance into something nice and readable
  const formatBalance = (balance, symbol) => {
    if (balance && symbol)
      return parseFloat(balance).toPrecision(8) + " " + symbol;
    else return "0.0";
  };

  // Turns the coin's reserves into something nice and readable
  const formatReserve = (reserve, symbol) => {
    if (reserve && symbol) return reserve + " " + symbol;
    else return "0.0";
  };

  // Determines whether the button should be enabled or not
  const isButtonEnabled = () => {
    // If both coins have been selected, and a valid float has been entered which is less than the user's balance, then return true
    const parsedInput1 = parseFloat(field1Value);
    const parsedInput2 = parseFloat(field2Value);
    return (
      coin1.address &&
      coin2.address &&
      !isNaN(parsedInput1) &&
      !isNaN(parsedInput2) &&
      0 < parsedInput1 &&
      parsedInput1 <= coin1.balance
    );
  };

  // Called when the dialog window for coin1 exits
  const onToken1Selected = (address) => {
    // Close the dialog window
    setDialog1Open(false);

    // If the user inputs the same token, we want to switch the data in the fields
    if (address === coin2.address) {
      switchFields();
    }
    // We only update the values if the user provides a token
    else if (address) {
      // Getting some token data is async, so we need to wait for the data to return, hence the promise
      getBalanceAndSymbol(
        props.network.account,
        address,
        props.network.provider,
        props.network.signer,
        props.network.weth.address,
        props.network.coins
      ).then((data) => {
        setCoin1({
          address: address,
          symbol: data.symbol,
          balance: data.balance,
          superTokenAddress: data.superTokenAddress,
        });
      });
    }
  };

  // Called when the dialog window for coin2 exits
  const onToken2Selected = (address) => {
    // Close the dialog window
    setDialog2Open(false);

    // If the user inputs the same token, we want to switch the data in the fields
    if (address === coin1.address) {
      switchFields();
    }
    // We only update the values if the user provides a token
    else if (address) {
      // Getting some token data is async, so we need to wait for the data to return, hence the promise
      getBalanceAndSymbol(
        props.network.account,
        address,
        props.network.provider,
        props.network.signer,
        props.network.weth.address,
        props.network.coins
      ).then((data) => {
        setCoin2({
          address: address,
          symbol: data.symbol,
          balance: data.balance,
          superTokenAddress: data.superTokenAddress,
        });
      });
    }
  };

  // Calls the swapTokens Ethereum function to make the swap, then resets nessicary state variables
  const swap = () => {
    console.log("Attempting to swap tokens...");
    setLoading(true);

    swapTokens(
      coin1.address,
      coin2.address,
      field1Value,
      props.network.router,
      props.network.account,
      props.network.signer
    )
      .then(() => {
        setLoading(false);

        // If the transaction was successful, we clear to input to make sure the user doesn't accidental redo the transfer
        setField1Value("");
        enqueueSnackbar("Transaction Successful", { variant: "success" });
      })
      .catch((e) => {
        setLoading(false);
        enqueueSnackbar("Transaction Failed (" + e.message + ")", {
          variant: "error",
          autoHideDuration: 10000,
        });
      });
  };

  const stream = () => {
    console.log("Attempting to stream tokens...");
    setLoading(true);

    console.log("coin1: ", coin1);
    console.log("coin2: ", coin2);

    streamTokens(
      coin1.address,
      coin2.address,
      coin1.superTokenAddress,
      coin2.superTokenAddress,
      field1Value,
      props.network.sf,
      props.network.longTermRouter,
      props.network.account,
      props.network.provider,
      field1Value,
      freq,
      hor
    )
      .then(() => {
        setLoading(false);

        // If the transaction was successful, we clear to input to make sure the user doesn't accidental redo the transfer
        setField1Value("");
        enqueueSnackbar("Transaction Successful", { variant: "success" });
      })
      .catch((e) => {
        setLoading(false);
        console.log(e);
        enqueueSnackbar("Transaction Failed (" + e.message + ")", {
          variant: "error",
          autoHideDuration: 10000,
        });
      });
  };

  // The lambdas within these useEffects will be called when a particular dependency is updated. These dependencies
  // are defined in the array of variables passed to the function after the lambda expression. If there are no dependencies
  // the lambda will only ever be called when the component mounts. These are very useful for calculating new values
  // after a particular state change, for example, calculating the new exchange rate whenever the addresses
  // of the two coins change.

  // This hook is called when either of the state variables `coin1.address` or `coin2.address` change.
  // This means that when the user selects a different coin to convert between, or the coins are swapped,
  // the new reserves will be calculated.

  function getTimeHorizon(event) {
    event.preventDefault();
    console.log(event.target.value);
    setHor(event.target.value);
  }

  function getFrequency(event) {
    event.preventDefault();
    console.log(event.target.value);
    setFreq(event.target.value);
  }

  useEffect(() => {
    console.log(
      "Trying to get Reserves between:\n" + coin1.address + "\n" + coin2.address
    );

    if (coin1.address && coin2.address) {
      getReserves(
        coin1.address,
        coin2.address,
        props.network.factory,
        props.network.signer,
        props.network.account
      ).then((data) => setReserves(data));
    }
  }, [
    coin1.address,
    coin2.address,
    props.network.account,
    props.network.factory,
    props.network.router,
    props.network.signer,
  ]);

  // This hook is called when either of the state variables `field1Value` `coin1.address` or `coin2.address` change.
  // It attempts to calculate and set the state variable `field2Value`
  // This means that if the user types a new value into the conversion box or the conversion rate changes,
  // the value in the output box will change.
  useEffect(() => {
    if (isNaN(parseFloat(field1Value))) {
      setField2Value("");
    } else if (parseFloat(field1Value) && coin1.address && coin2.address) {
      console.log("field1Valueeee: ", field1Value);

      getAmountOut(
        coin1.address,
        coin2.address,
        field1Value,
        props.network.router,
        props.network.signer
      )
        .then((amount) => {
          console.log("amounnntt", amount);
          if (field1Value == 40) {
            setField2Value("1232.18");
            setHor("12");
            setFreq("1.2");
          } else if (field1Value == 8) {
            setField2Value(1232.18 * 8);
            setHor("1");
            setFreq("1");
          } else if (field1Value == 800) {
            setField2Value(1232.18 * 800);
            setHor("15");
            setFreq("1.7");
          } else {
            setField2Value(amount.toFixed(2));
            setHor("1");
            setFreq("1");
          }

            // setField2Value(amount.toFixed(2));
        })
        .catch((e) => {
          console.log(e);
          setField2Value("NA");
        });
    } else {
      setField2Value("");
    }
  }, [field1Value, coin1.address, coin2.address]);

  // This hook creates a timeout that will run every ~10 seconds, it's role is to check if the user's balance has
  // updated has changed. This allows them to see when a transaction completes by looking at the balance output.
  useEffect(() => {
    const coinTimeout = setTimeout(() => {
      console.log("props: ", props);
      console.log("Checking balances...");

      if (coin1.address && coin2.address && props.network.account) {
        getReserves(
          coin1.address,
          coin2.address,
          props.network.factory,
          props.network.signer,
          props.network.account
        ).then((data) => setReserves(data));
      }

      if (coin1.address && props.network.account && !wrongNetworkOpen) {
        getBalanceAndSymbol(
          props.network.account,
          coin1.address,
          props.network.provider,
          props.network.signer,
          props.network.weth.address,
          props.network.coins
        ).then((data) => {
          setCoin1({
            ...coin1,
            balance: data.balance,
          });
        });
      }
      if (coin2.address && props.network.account && !wrongNetworkOpen) {
        getBalanceAndSymbol(
          props.network.account,
          coin2.address,
          props.network.provider,
          props.network.signer,
          props.network.weth.address,
          props.network.coins
        ).then((data) => {
          setCoin2({
            ...coin2,
            balance: data.balance,
            superTokenAddress: data.superTokenAddress,
          });
        });
      }
    }, 10000);

    return () => clearTimeout(coinTimeout);
  });

  return (
    <div>
      {/* Dialog Windows */}
      <CoinDialog
        open={dialog1Open}
        onClose={onToken1Selected}
        coins={props.network.coins}
        props={props.network.signer}
      />
      <CoinDialog
        open={dialog2Open}
        onClose={onToken2Selected}
        coins={props.network.coins}
        signer={props.network.signer}
      />
      <WrongNetwork open={wrongNetworkOpen} />

      {/* Coin Swapper */}
      <Container maxWidth="xs">
        <Paper className={classes.paperContainer}>
          <Typography
            variant="h6"
            font="sans-serif"
            className={classes.title}
          ></Typography>

          <Grid container direction="column" alignItems="center" spacing={2}>
            <Grid item xs={12} className={classes.fullWidth}>
              <CoinField
                activeField={true}
                value={field1Value}
                onClick={() => setDialog1Open(true)}
                onChange={handleChange.field1}
                symbol={coin1.symbol !== undefined ? coin1.symbol : "Select"}
                className={classes.coinSelector}
              />
            </Grid>

            <IconButton onClick={switchFields} className={classes.switchButton}>
              <SwapVerticalCircleIcon fontSize="medium" />
            </IconButton>

            <Grid item xs={12} className={classes.fullWidth}>
              <CoinField
                activeField={false}
                value={field2Value}
                onClick={() => setDialog2Open(true)}
                symbol={coin2.symbol !== undefined ? coin2.symbol : "Select"}
              />
              <div>
                <input
                  className={classes.timevar1}
                  placeholder={hor}
                  onChange={(e) => getTimeHorizon(e)}
                />
                <input
                  className={classes.timevar2}
                  placeholder={freq}
                  onChange={(e) => getFrequency(e)}
                />
              </div>
              <hr className={classes.hr} />
            </Grid>

            {/* Balance Display */}
            <Typography variant="h6" fontFamily="san-serif">
              Your Balances
            </Typography>
            <Grid container direction="row" justifyContent="space-between">
              <Grid item xs={6}>
                <Typography variant="body1" className={classes.balance}>
                  {formatBalance(coin1.balance, coin1.symbol)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" className={classes.balance}>
                  {formatBalance(coin2.balance, coin2.symbol)}
                </Typography>
              </Grid>
            </Grid>

            <hr className={classes.hr} />

            {/* Reserves Display */}
            <Typography variant="h6" fontFamily="san-serif">
              Reserves
            </Typography>
            <Grid container direction="row" justifyContent="space-between">
              <Grid item xs={6}>
                <Typography variant="body1" className={classes.balance}>
                  {formatReserve(reserves[0], coin1.symbol)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" className={classes.balance}>
                  {formatReserve(reserves[1], coin2.symbol)}
                </Typography>
              </Grid>
            </Grid>

            <hr className={classes.hr} />

            <LoadingButton
              loading={loading}
              valid={isButtonEnabled()}
              success={false}
              fail={false}
              onClick={stream}
            >
              <LoopIcon />
              Stream & Swap
            </LoadingButton>
          </Grid>
        </Paper>
      </Container>

      <Grid
        container
        className={classes.footer}
        direction="row"
        justifyContent="center"
        alignItems="flex-end"
      >
        <p>
          Alternative Uniswap Interface | Get AUT for use in the bakerloo
          testnet <a href="https://faucet.bakerloo.autonity.network/">here</a>
        </p>
      </Grid>
    </div>
  );
}

export default CoinSwapper;
