import React, { useState, useEffect } from "react";
import Select from "react-select";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Box, Typography } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import { DataGridPro } from "@mui/x-data-grid-pro";
import { LicenseInfo } from "@mui/x-data-grid-pro";
import { getDir } from "./utility";
// https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/logs

function App() {
  LicenseInfo.setLicenseKey(
    "5b931c69b031b808de26d5902e04c36fTz00Njk0NyxFPTE2ODg4MDI3MDM3MjAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI="
  );
  const [dirContent, setDirContent] = useState(null),
    urlPrefix = window.location.protocol + "//" + window.location.host,
    { href } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    webDavPrefix =
      mode === "local"
        ? "https://xarprod.ondemand.sas.com/lsaf/webdav/repo"
        : urlPrefix,
    [windowDimension, detectHW] = useState({
      winWidth: window.innerWidth,
      winHeight: window.innerHeight,
    }),
    detectSize = () => {
      calcSectionSizes();
      detectHW({
        winWidth: window.innerWidth,
        winHeight: window.innerHeight,
      });
    },
    topSpace = 300,
    dropDownMargin = 150,
    [sectionSizes, setSectionSizes] = useState([topSpace, 200, 200]),
    calcSectionSizes = () => {
      const section2 = Math.floor(
          (windowDimension.winHeight - topSpace) / 2 - 50
        ),
        section3 = Math.floor((windowDimension.winHeight - topSpace) / 2 + 50);
      setSectionSizes([topSpace, section2, section3]);
    },
    dataFromFiles = [],
    [syncData, setSyncData] = useState(null),
    [usesData, setUsesData] = useState(null),
    loadFile = (url) => {
      return new Promise((resolve) => {
        fetch(url).then(function (response) {
          response
            .text()
            .then(function (text) {
              const json = JSON.parse(text);
              dataFromFiles.push(json);
              resolve("ok");
            })
            .catch((err) => resolve("failed"));
        });
      });
    },
    // collapse all the data we currently have into a more usable format
    updateSyncData = () => {
      let allData = [];
      for (const item of dataFromFiles) {
        allData = allData.concat(item);
      }
      // console.log(allData);
      const modifiedData = [];
      for (const item of allData) {
        const split = item.dir.split("/"),
          compound = (item.compound = split[2]),
          indication = (item.indication = split[3]),
          study = (item.study = split[4]);
        modifiedData.push({
          ...item,
          compound: compound,
          indication: indication,
          study: study,
          year: item.dt.substring(0, 4),
          month: item.dt.substring(4, 6),
          day: item.dt.substring(6, 8),
          time: item.dt.substring(9),
        });
      }
      processModifiedData(modifiedData);
    },
    processModifiedData = (modifiedData) => {
      setCompoundList(summarize(modifiedData, "compound"));
      setIndicationList(summarize(modifiedData, "indication"));
      setStudyList(summarize(modifiedData, "study"));
      setYearList(summarize(modifiedData, "year"));
      setMonthList(summarize(modifiedData, "month"));
      setUserList(summarize(modifiedData, "un"));

      setSyncData(modifiedData);

      // summarise down to one row per use of the lsaf sync tool
      // console.log("modifiedData", modifiedData);
      let prev = { un: "", dt: "" },
        uses = [];
      modifiedData.forEach((row) => {
        if (row.un !== prev.un || row.dt !== prev.dt) {
          const year = Number(row.dt.substring(0, 4)),
            month = Number(row.dt.substring(4, 6)),
            day = Number(row.dt.substring(6, 8)),
            hour = Number(row.dt.substring(9, 11)),
            min = Number(row.dt.substring(11, 13)),
            sec = Number(row.dt.substring(13, 15)),
            date = new Date(Date.UTC(year, month - 1, day, hour, min, sec)),
            week = getWeek(date);
          // console.log(year, month, day, hour, min, sec);
          uses.push({
            un: row.un,
            dt: date,
            dt2: row.dt,
            year: year,
            month: month,
            week: week,
            yearWeek: year + "-" + (week <= 9 ? "0" + week : week),
          });
        }
        prev = row;
      });
      setUsesData(uses);
    },
    testData = [
      {
        un: "gkalema",
        dir: "/clinical/argx-113/itp/argx-113-1801/biostat/staging/final/qc_adam",
        dt: "20220518_003915",
        vs: "sync",
        fs: false,
      },
      {
        un: "gkalema",
        dir: "/clinical/argx-113/itp/argx-113-1801/biostat/staging/final/qc_tlf",
        dt: "20220516_003915",
        vs: "sync",
        fs: false,
      },
      {
        un: "gkalema",
        dir: "/clinical/argx-117/itp/argx-113-1801/biostat/staging/posthoc",
        dt: "20220516_003915",
        vs: "sync",
        fs: false,
      },
      {
        un: "pmason",
        dir: "/clinical/argx-113/mg/argx-113-1801/biostat/staging/testrun3/qc_adam",
        dt: "20230101_003915",
        vs: "sync",
        fs: false,
      },
    ],
    [filteredData, setFilteredData] = useState(null),
    colsSyncData = [
      { field: "dir", headerName: "Directory", width: 300, flex: 1 },
      { field: "un", headerName: "User", width: 100 },
      { field: "compound", headerName: "Compound", width: 100 },
      { field: "indication", headerName: "Indication", width: 100 },
      { field: "study", headerName: "Study", width: 150 },
      { field: "dt", headerName: "Date", width: 150 },
    ],
    [compoundList, setCompoundList] = useState(null),
    [compound, setCompound] = useState(""),
    [indicationList, setIndicationList] = useState(null),
    [indication, setIndication] = useState(""),
    [studyList, setStudyList] = useState(null),
    [study, setStudy] = useState(""),
    [yearList, setYearList] = useState(null),
    [year, setYear] = useState(""),
    [monthList, setMonthList] = useState(null),
    [month, setMonth] = useState(""),
    [userList, setUserList] = useState(null),
    [user, setUser] = useState(""),
    [graph1, setGraph1] = useState(null),
    [graph2, setGraph2] = useState(null),
    summarize = (data, by) => {
      const reduced = data.reduce(function (previous, item) {
          const key = item[by];
          if (!(key in previous)) previous[key] = 0;
          return { ...previous, [key]: previous[key] + 1 };
        }, {}),
        info = Object.keys(reduced).map((key) => {
          return { value: key, label: key + " (" + reduced[key] + ")" };
        });
      info.sort((a, b) => {
        const fa = a.value.toLowerCase(),
          fb = b.value.toLowerCase();
        if (fa < fb) {
          return -1;
        }
        if (fa > fb) {
          return 1;
        }
        return 0;
      });
      return [{ value: "*", label: "All" }, ...info];
    },
    selectStyles = {
      control: (baseStyles, state) => ({
        ...baseStyles,
        fontSize: "12px",
        borderColor: state.isFocused ? "green" : "red",
      }),
      option: (baseStyles, state) => ({
        ...baseStyles,
        fontSize: "12px",
      }),
    },
    getWeek = (date) => {
      var onejan = new Date(date.getFullYear(), 0, 1);
      return Math.ceil(((date - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    };

  useEffect(() => {
    calcSectionSizes();
    window.addEventListener("resize", detectSize);
    return () => {
      window.removeEventListener("resize", detectSize);
    };
    // eslint-disable-next-line
  }, [windowDimension]);

  // get a list of files from the directory
  useEffect(() => {
    getDir("/general/biostat/metadata/projects/logs", 1, setDirContent);
  }, []);

  // load the files from directory
  useEffect(() => {
    if (!dirContent) return;
    // console.log(dirContent);
    // loadFile(
    //   webDavPrefix +
    //     "/lsaf/webdav/repo/general/biostat/metadata/projects/logs/lsafsynclog20230103.json"
    // );
    handleLoadingData(dirContent);
    // eslint-disable-next-line
  }, [dirContent]);

  const handleLoadingData = async (dirContent) => {
    const asyncFunctions = [];
    for (const file of dirContent) {
      asyncFunctions.push(loadFile(webDavPrefix + file));
    }
    await Promise.all(asyncFunctions);
    updateSyncData();
  };

  useEffect(() => {
    if (mode !== "local") return;
    const modifiedData = [];
    for (const item of testData) {
      const split = item.dir.split("/"),
        compound = (item.compound = split[2]),
        indication = (item.indication = split[3]),
        study = (item.study = split[4]);
      modifiedData.push({
        ...item,
        compound: compound,
        indication: indication,
        study: study,
        year: item.dt.substring(0, 4),
        month: item.dt.substring(4, 6),
        day: item.dt.substring(6, 8),
        time: item.dt.substring(9),
      });
    }
    processModifiedData(modifiedData);
    // eslint-disable-next-line
  }, [mode]);

  // filter data for table and graph 1
  useEffect(() => {
    if (!syncData) return;
    // console.log("compound", compound, "testData", testData);
    const tempFilteredData = syncData
      .filter((item) => {
        if (compound && compound.value !== "*")
          return item.compound === compound.value;
        else return true;
      })
      .filter((item) => {
        if (indication && indication.value !== "*")
          return item.indication === indication.value;
        else return true;
      })
      .filter((item) => {
        if (study && study.value !== "*") return item.study === study.value;
        else return true;
      })
      .filter((item) => {
        if (year && year.value !== "*") return item.year === year.value;
        else return true;
      })
      .filter((item) => {
        if (month && month.value !== "*") return item.month === month.value;
        else return true;
      })
      .filter((item) => {
        if (user && user.value !== "*") return item.un === user.value;
        else return true;
      })
      .map((row, id) => {
        row.id = id;
        return row;
      });
    // console.log("tempFilteredData", tempFilteredData);
    setFilteredData(tempFilteredData);

    // define graph to show
    const categories = compoundList.map((row) => row.value),
      subgroups = indicationList.map((row) => row.value),
      tempSeries = [];
    categories.shift(); // remove * from start of array
    subgroups.shift(); // remove * from start of array
    const numCategories = categories.length,
      numSubgroups = subgroups.length;

    for (let i = 0; i < numCategories; i++) {
      const tempArray = [];
      for (let j = 0; j < numSubgroups; j++) {
        tempArray.push(0);
      }
      tempSeries.push(tempArray);
    }

    // add up the elements for graph 1
    tempFilteredData.forEach((element) => {
      const indCompound = categories.indexOf(element.compound),
        indIndication = subgroups.indexOf(element.indication);
      if (indCompound >= 0 && indIndication >= 0) {
        tempSeries[indCompound][indIndication] =
          tempSeries[indCompound][indIndication] + 1;
      }
    });
    const series1 = [];
    // put the data into the right format required by highcharts for graph 1
    for (let j = 0; j < numSubgroups; j++) {
      const bit = [];
      for (let i = 0; i < numCategories; i++) {
        bit.push(tempSeries[i][j]);
      }
      series1.push({ name: subgroups[j], data: bit });
    }
    // console.log("series1", series1);
    setGraph1({
      chart: {
        type: "bar",
        height: sectionSizes[2],
        zooming: { type: "xy" },
      },
      accessibility: {
        enabled: false,
      },
      title: {
        text: null,
      },
      credits: {
        enabled: false,
      },
      // colors: ["#b3ffb3", "#ffe0b3", "#ffb3b3"],
      yAxis: {
        min: 0,
        enabled: false,
        labels: { enabled: false },
        title: {
          enabled: false,
        },
      },
      xAxis: {
        categories: categories,
      },
      plotOptions: {
        series: {
          groupPadding: 0.05,
          pointPadding: 0,
          stacking: "normal",
          dataLabels: {
            enabled: true,
          },
        },
      },
      series: series1,
    });

    // eslint-disable-next-line
  }, [compound, indication, study, year, month, user, syncData]);

  // filter data for graph 2
  useEffect(() => {
    if (!usesData) return;
    // console.log("usesData", usesData);
    const tempFilteredData = usesData
      .filter((item) => {
        if (year && year.value !== "*") return item.year === Number(year.value);
        else return true;
      })
      .filter((item) => {
        if (month && month.value !== "*")
          return item.month === Number(month.value);
        else return true;
      })
      .filter((item) => {
        if (user && user.value !== "*") return item.un === user.value;
        else return true;
      })
      .map((row, id) => {
        row.id = id;
        return row;
      });
    // console.log("tempFilteredData", tempFilteredData);

    // if we dont have any data then dont show the graph
    if (tempFilteredData.length === 0) {
      setGraph2(null);
      return;
    }

    // make zero array that we can add values into
    const min = tempFilteredData.reduce((prev, current) => {
        if (current.yearWeek < prev.yearWeek) return current;
        else return prev;
      }),
      max = tempFilteredData.reduce((prev, current) => {
        if (current.yearWeek > prev.yearWeek) return current;
        else return prev;
      }),
      tempSeries = [];
    for (let y = min.year; y <= max.year; y++) {
      for (let w = 1; w <= 52; w++) {
        const thisWeek = y + "-" + (w <= 9 ? "0" + w : w);
        if (min.yearWeek <= thisWeek && thisWeek <= max.yearWeek) {
          tempSeries[thisWeek] = 0;
        }
      }
    }
    // console.log(tempSeries);

    // add up the elements for graph 2
    tempFilteredData.forEach((element) => {
      tempSeries[element.yearWeek] += 1;
    });
    // console.log("min", min, "max", max, "tempSeries", tempSeries);

    // put the data into the right format required by highcharts for graph 2
    const tempSeries2 = [];
    Object.keys(tempSeries).forEach((key) => {
      tempSeries2.push([key, tempSeries[key]]);
    });
    // console.log(tempSeries2);
    const series2 = [
      {
        name: "Total Uses",
        data: tempSeries2,
      },
    ];

    setGraph2({
      chart: {
        type: "spline",
        height: sectionSizes[2],
      },
      accessibility: {
        enabled: false,
      },
      title: {
        text: null,
      },
      credits: {
        enabled: false,
      },
      // colors: ["#b3ffb3", "#ffe0b3", "#ffb3b3"],
      yAxis: {
        min: 0,
        title: {
          text: "Uses",
        },
      },
      xAxis: {
        type: "category",
      },
      plotOptions: {
        // series: {
        //   groupPadding: 0.05,
        //   pointPadding: 0,
        //   stacking: "normal",
        //   dataLabels: {
        //     enabled: true,
        //   },
        // },
      },
      series: series2,
    });
    // eslint-disable-next-line
  }, [compound, indication, study, year, month, user, usesData]);

  // console.log(graph2);

  return (
    <Box>
      <Typography sx={{ ml: 3 }} variant="h6">
        LSAF Sync activity using data from
        /general/biostat/metadata/projects/logs
      </Typography>
      <Grid2 container spacing={2}>
        <Grid2 item xs={2} sx={{ ml: 1, mt: 1 }}>
          {compoundList && (
            <Select
              placeholder="Search compound"
              options={compoundList}
              value={compound}
              onChange={setCompound}
              menuIsOpen={true}
              maxMenuHeight={sectionSizes[0] - dropDownMargin}
              styles={selectStyles}
            />
          )}
        </Grid2>
        <Grid2 item xs={2} sx={{ ml: 1, mt: 1 }}>
          {indicationList && (
            <Select
              placeholder="Search indication"
              options={indicationList}
              value={indication}
              onChange={setIndication}
              menuIsOpen={true}
              maxMenuHeight={sectionSizes[0] - dropDownMargin}
              styles={selectStyles}
            />
          )}
        </Grid2>
        <Grid2 item xs={2} sx={{ ml: 1, mt: 1 }}>
          {studyList && (
            <Select
              placeholder="Search study"
              options={studyList}
              value={study}
              onChange={setStudy}
              menuIsOpen={true}
              maxMenuHeight={sectionSizes[0] - dropDownMargin}
              styles={selectStyles}
            />
          )}
        </Grid2>
        <Grid2 item xs={2} sx={{ ml: 1, mt: 1 }}>
          {userList && (
            <Select
              placeholder="Search user"
              options={userList}
              value={user}
              onChange={setUser}
              menuIsOpen={true}
              maxMenuHeight={sectionSizes[0] - dropDownMargin}
              styles={selectStyles}
            />
          )}
        </Grid2>
        <Grid2 item sx={{ ml: 1, mt: 1 }}>
          {yearList && (
            <Select
              placeholder="Search year"
              options={yearList}
              value={year}
              onChange={setYear}
              menuIsOpen={true}
              maxMenuHeight={sectionSizes[0] - dropDownMargin}
              styles={selectStyles}
            />
          )}
        </Grid2>
        <Grid2 item sx={{ ml: 1, mt: 1 }}>
          {monthList && (
            <Select
              placeholder="Search month"
              options={monthList}
              value={month}
              onChange={setMonth}
              menuIsOpen={true}
              maxMenuHeight={sectionSizes[0] - dropDownMargin}
              styles={selectStyles}
            />
          )}
        </Grid2>
        <Grid2 item md={12} sx={{ ml: 1, mt: 25 }}>
          {filteredData && (
            <Box sx={{ height: sectionSizes[1] }}>
              <DataGridPro
                rows={filteredData}
                columns={colsSyncData}
                density="compact"
                rowHeight={30}
                hideFooter={true}
                sx={{
                  fontSize: "0.8em",
                }}
              />
            </Box>
          )}
        </Grid2>
        <Grid2 item md={6} sx={{ ml: 1 }}>
          {graph1 && (
            <HighchartsReact highcharts={Highcharts} options={graph1} />
          )}
        </Grid2>
        <Grid2 item md={5} sx={{ ml: 1 }}>
          {graph2 && (
            <HighchartsReact highcharts={Highcharts} options={graph2} />
          )}
        </Grid2>
      </Grid2>
    </Box>
  );
}

export default App;
