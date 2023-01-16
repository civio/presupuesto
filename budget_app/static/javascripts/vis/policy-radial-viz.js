function PolicyRadialViz(_selector,_data,_policyDetails) {
  // console.log(d3.version); // 7.8.1
  // console.log(d3.selection())
  // console.log(d3.selection().join())

  // // TEST: NOW WORKING :(
  // d3.select("#policy-radial-viz")
  //   .append("g")
  //   .selectAll("text")
  //   .data([0,30,60])
  //   // .join("text") //?
  //   .enter()
  //   .append()
  //   .text(d => d)

  var selector          = _selector,
      data              = _data,
      policyDetails     = _policyDetails,
      year              = null,
      // year              = 2021,
      languageSelector  = "es",
      
      // Colors
      colorPrimary      = "#003DF6",
      colorSecondary    = "#cce3f9",
      colorLight        = "#E7F2FC",
      colorNoData       = "rgb(224, 224, 224)",
      textFillNoData    = "rgb(204, 204, 204)",
      
      baseOpacityIcons  = 0.9,
      baseOpacityPetals = 0.7,
      baseOpacityTexts  = 0.9,
      hidingOpacityPetals = 0.05,
      hidingOpacityTexts  = 0.08,
      finalOpacityPetals  = 1,
      
      // Dimensions
      myWidth,
      height,
      maxWidth          = 900,
      mediaQueryLimit   = 600,  // Width size to use mobile layout (mobileBreakpoint)
      isMobile,
      
      outerRadius       = 300,
      innerRadius       = 90,
      padding           = 0.09,
      margin            = 150,
      
      imgSize           = 175,
      iconOffset        = 25,
      iconSize          = 25,

      svg,
      vizGroup,
      centralLegend,
      petals,
      icons,
      auxEl,
      auxNodeGroup,
      radialChart,
      nodeGroup,
      percentageGroup,
      titleGroup,

      xScale,
      yScale,
      yScaleAux,
      radialAxis,

      imgURL            = "https://static.observableusercontent.com/files/46700676dabb57e8a456eeb06a3cfd18ac69c7637140295e06deed890c1b7810bfa46456b2d91f043c148c1448c614629333ad7d21dd6b467b206e9ca86015d0"
      isMobile          = false,
      percentSteps      = [0, 25, 50, 75, 100], // Visible steps on chart when interacting

      // arc,
      // auxArcPixels,
      // auxArcFactor,
      // auxArcInteractions;

      // enterDuration     = 900;
      updateDuration    = 600;

  // Setup
  this.setup = function() {

    ///////////////
    // Set SVG
    svg = d3.select(selector).select("svg")

    // Set dimensions and center viz group
    setVizDimensions();
    centerViz();

    //  Create central legend
    centralLegend = vizGroup.append("g").attr("id", "central-legend").call(createLegend);

    ///////////////
    // Set scales
    setXScale();
    setYScale();
    setYScaleAux();

    ///////////////
    // Set radial axis
    vizGroup.append("g").attr("id", "radial-axis")
      .call(radialAxis);

    ///////////////
    // Create aux elements for interactions
    auxEl = vizGroup.append("g").attr("id", "aux-el");
    auxNodeGroup = auxEl
      .selectAll("g")
      .data(data)
      // .join("g")
      .enter()
      .append("g")
      .append("a")
      .attr("target", "_self")
      .attr("href", isMobile ? null : (d) => `${d.url}&year=${year}`)
      .append("path")
      .attr("d", auxArcInteractions)
      .style("fill", "transparent")
      .style("cursor", "pointer")
      .on("mouseover", onMouseOver)
      .on("mouseleave", onMouseOut);
    // Add URL links
    auxNodeGroup.append("title").text((d) => `${d.url}&year=${year}`)
    .append("path")

  // Prepare Radial chart
  radialChart = vizGroup
    .append("g")
    .attr("id", "node-el")
    .style("pointer-events", "none");
  
    // Here?
  nodeGroup = radialChart.selectAll("g").data(data)
    .enter()
    .append("g");
  // .join("g");

  // Create petals from 0,0
  petals = nodeGroup
      .append("path")
      .attr("class", "petal")
      .attr("data-code", (d) => d.code)
      .attr("d", arc)
      .style("fill", colorPrimary)
      .style("opacity", baseOpacityPetals);

  // Prepare icons
  icons = nodeGroup
   .append("image")
   .attr("class", "icon")
   .attr("width", iconSize)
   .attr("height", iconSize)
   .attr("href", d => `/static/assets/${findIcon(d.code, policyDetails)}_${isMobile ? "color" : "white"}.svg`)
   .style("opacity", baseOpacityIcons);

  // Prepare titles
  titleGroup = nodeGroup
    .append("g")
    .attr("class", "policy-group")
    .style("font-weight", 800)
    .style("dominant-baseline", "middle");

  // Create invisible title texts
  titleGroup.each(function (a) {
    const el = d3.select(this);
    // console.log(el)
    const offset = 15;
    const labelLines = a.labelSplitted;
    const labelLinesLenght = labelLines.length;
    const offsetBtwnLines = isMobile ? 12 : 10;

    // TO BE IMPROVED
    const scaleOffset = d3
      .scaleLinear()
      .domain([0, labelLinesLenght - 1]) // Max number of splits
      .range([
        -offsetBtwnLines * (labelLinesLenght / 2),
        offsetBtwnLines * (labelLinesLenght / 2)
      ]);

    // TODO: CHECK THIS
    if (isMobile) {
      const rectWidth = outerRadius * 2;
      const rectHeight = labelLinesLenght * 20;
      titleGroup
        .selectAll("rect")
        .data([1])
        // .join("rect")
        .enter()
        .append("rect")
        .attr("x", -rectWidth / 2)
        .attr("y", -rectHeight / 2)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .style("fill", colorPrimary);
    }

    el.selectAll("text")
      .data(labelLines)
      // .join("text")
      .enter()
      .append("text")
      // Attr. "x" later on the update function
      .attr("y", 0)
      .attr("dy", (d, i) => scaleOffset(i))
      .text((d) => `${d}`)
      .attr("transform", (d) =>
        a.isLefttHalf && !isMobile ? "rotate(180)" : "rotate(0)"
      )
      .style("opacity", baseOpacityTexts)
      .style("opacity", 0.1) // Temporal
      // On mobile, I don't want to pass any function, but "" or null options are not working, so passing d => d
      // Passing an argument to a call function
      // .call(
      //   isMobile ? (d) => d : cloneToImproveReadability,
      //   5,
      //   colorNeutral(900)
      // );
  });

  // Prepare percentages %
  percentageGroup = nodeGroup
    .append("g")
    .attr("class", "percentage-group")
    // // When no data
    // .attr("visibility", (d) =>
    //   isMobile || d[`value_${yearSelector}`] === "NA" ? "hidden" : "visible"
    // )
    .style("transform", (d) =>
      isMobile ? "" : `rotate(${xScale(d.code) + xScale.bandwidth() / 2}rad)`
    );

    if (!isMobile) {
      // Titles
      titleGroup
        .style("font-size", "14px")
        .attr("transform", function (d) {
          const angleToRotate =
            ((xScale(d.code) + xScale.bandwidth() / 2) * 180) / Math.PI - 90;
          return `rotate(${angleToRotate})`;
        })
        .style("text-anchor", function (d) {
          const myAngleDeg = radiansToDeg(
            (xScale(d.code) + xScale.bandwidth() / 2 + Math.PI) % (2 * Math.PI)
          );
          // Adding a new flag key to the data
          d["isLefttHalf"] = myAngleDeg > 0 && myAngleDeg < 180;
          return d.isLefttHalf ? "end" : "start";
        });
    } else {
      const offsetTitleMobile = height / 2 - 180;
      titleGroup
        .style("font-size", "16px")
        .style("text-anchor", "middle")
        .attr("transform", `translate(0,${offsetTitleMobile})`);
    }

  // Create empty texts for percents
  percents = percentageGroup
    .append("text")
    .attr("font-size", isMobile ? "14px" : "15px")
    .style("dominant-baseline", "middle")
    .attr("font-weight", 800)
    .attr("text-anchor", "middle")
    // // With no data
    // .style("opacity", (d) => (d[`value_${year}`] === "NA" ? 0 : 1))
    // Attr. "text" later on the update function
    .attr("transform", function (d) {
      const myAngleDeg = radiansToDeg(
        (xScale(d.code) + xScale.bandwidth() / 2 + Math.PI) % (2 * Math.PI)
      );
      // Adding a new flag key to the data
      d["isUpperHalf"] = myAngleDeg > 90 && myAngleDeg < 270;
      if (isMobile) return "";
      else {
        return d.isUpperHalf ? "rotate(0)" : "rotate(180)";
      }
    })
  // .call(cloneToImproveReadability, 4, colorPrimary);

    return this;
  };

  // Update
  this.update = function(year) {
    // console.log(this)
    console.log("this.update function", "Year", year)

    //////////
    // Draw petals
    // const nodeGroup = radialChart.selectAll("g").data(data)
    // // .join("g");
    // .enter()
    // .append("g")
  
    
    // Set petals transition
    arc.outerRadius((d) => yScale(d[`value_${year}`]))
    petals.transition("unbreak").duration(updateDuration).attr("d", arc);

    ////////
    // 2.Update icons position
    auxArcPixels
      .innerRadius((d) =>
        d[`value_${year}`] !== "NA"
          ? yScale(d[`value_${year}`]) - yScale(0) + yScale(0) - iconOffset
          : yScale(100) - yScale(0) + yScale(0) - iconOffset
      )
      .outerRadius((d) =>
        d[`value_${year}`] !== "NA"
          ? yScale(d[`value_${year}`]) - yScale(0) + yScale(0) - iconOffset
          : yScale(100) - yScale(0) + yScale(0) - iconOffset
      );
    icons
      .transition("unbreak")
      .duration(updateDuration)
      .attr("x", (d) => auxArcPixels.centroid(d)[0] - iconSize / 2)
      .attr("y", (d) => auxArcPixels.centroid(d)[1] - iconSize / 2);
      
    ////////
    // 3.Update titles position
    if (!isMobile) {
      // d3.selectAll(titleGroup).each(function (a) {
      titleGroup.each(function (a) {
        const el = d3.select(this);
        el.selectAll("text") // Selecting both the visible text and the white clone
          .transition("unbreak")
          .duration(updateDuration)
          .style("opacity", baseOpacityTexts)
          .attr("fill", (d) =>
            a[`value_${year}`] !== "NA" ? colorNeutral(1000) : textFillNoData
          )
          .attr("x", function (d) {
            const offset = a[`value_${year}`] === "NA" ? 10 : 20;
            if (a[`value_${year}`] !== "NA") {
              return a.isLefttHalf
                ? -yScale(a[`value_${year}`] + offset)
                : yScale(a[`value_${year}`] + offset);
              // When no data
            } else {
              return a.isLefttHalf
                ? -yScale(100 + offset)
                : yScale(100 + offset);
            }
          });
      });
    }

    ////////
    // 4.Update %% content & position

    // Update their position
    if (!isMobile) {
      percentageGroup
        .selectAll("text") // Selecting both the visible text and the white clone
        .style("opacity", 0)
        .transition()
        .duration(updateDuration + 300)
        // With no data
        .style("opacity", (d) => (d[`value_${year}`] === "NA" ? 0 : 1))
        .attr("x", 0)
        .attr("y", function (d) {
          const offset = 14;
          return d.isUpperHalf
            ? -yScale(d[`value_${year}`]) - offset
            : yScale(d[`value_${year}`]) + offset;
        })
        // Adding no data possiblity
        .text((d) =>
          d[`value_${year}`] ? formatDecimal(d[`value_${year}`]) + "%" : ""
        )
    }
    
    return this;
  }

  // Set scales
  function setXScale() {
    xScale = d3
    .scaleBand()
    .domain(data.map((d) => d.code))
    .range([0, 2 * Math.PI]) // [0, 360º]
    .align(0);
  }
  function setYScale() {
    yScale = d3
    .scaleRadial()
    .domain([0, 100]) // Values are percents 0-100%
    .range([innerRadius, outerRadius])
  }
  function setYScaleAux() {
    yScaleAux = d3
    .scaleRadial()
    .domain([0, 100]) // Values are percents 0-100%
    .range([innerRadius, myWidth / 2])
  }

  // Set main element dimensions
  function setVizDimensions() {
    width = $(selector).width();
    isMobile = width < mediaQueryLimit;
    // console.log("isMobile?", isMobile);

    myWidth = Math.min(maxWidth, width);
    height = isMobile ? myWidth + 400 : myWidth;

    // Set main element height
    // $(selector)
    svg
    .attr("height", height )
    .attr("width", myWidth )
    .style("font", "10px sans-serif");
    // // Update font-size scale domain
    // fontSizeScale.domain([1, Math.sqrt(width*height) * 0.5]);
  }
  // Center the whole group
  function centerViz() {
    vizGroup = svg
      .append("g")
      .attr("transform", `translate(${myWidth / 2}, ${height / 2})`); // Middle point
  }


  // Interactions
  function onMouseOver(event, d, i) {
    // console.log(event, d, i)
  }
  function onMouseOut(event, d, i) {
    // console.log(event, d, i)
  }


  // Generators
  const createLegend = (g) =>
    g
    .append("image")
    .attr("transform", `translate(${-imgSize / 2}, ${-imgSize / 2})`)
    .attr("href", imgURL)
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", imgSize)
    .attr("height", imgSize)

  const cloneToImproveReadability = (selection, strokeWidth, color) => {
    selection
      // To improve readability
      // White background
      .attr("stroke", colorNeutral(0))
      .attr("stroke-width", strokeWidth)
      // Black visible text
      .clone(true) // Not wokring :(
      .attr("fill", color)
      .attr("stroke", "none");
  }

  const arc = d3
    .arc()
    .innerRadius((d) => yScale(0))
    .outerRadius((d) => yScale(0.001))
    .startAngle((d) => xScale(d.code))
    .endAngle((d) => xScale(d.code) + xScale.bandwidth())
    .padAngle(padding)
    .padRadius(innerRadius);
  
  // To place labels inside our chart, along each petal, in a specific % position
  const auxArcFactor = (factor) =>
    d3
      .arc()
      // Attr. "innerRadius" later on the update function
      // Attr. "outerRadius" later on the update function
      .startAngle((d) => xScale(d.code))
      .endAngle((d) => xScale(d.code) + xScale.bandwidth())
      .padAngle(padding)
      .padRadius(innerRadius) 
  
  // To place labels inside our chart, along each petal, in a specific px position
  const auxArcPixels = d3
    .arc()
    // Attr. "innerRadius" later on the update function
    .innerRadius(
      (d) =>
        yScale(d[`value_${year}`]) - yScale(0) + yScale(0) - iconOffset
    )
    // Attr. "outerRadius" later on the update function
    .outerRadius(
      (d) =>
        yScale(d[`value_${year}`]) - yScale(0) + yScale(0) - iconOffset
    )

    .startAngle((d) => xScale(d.code))
    .endAngle((d) => xScale(d.code) + xScale.bandwidth())
    .padAngle(padding)
    .padRadius(innerRadius);

  // Creating invisible arcs 100% big for interactions
  const auxArcInteractions = d3
    .arc()
    .innerRadius((d) => yScaleAux(0))
    .outerRadius((d) => yScaleAux(100))
    .startAngle((d) => xScale(d.code))
    .endAngle((d) => xScale(d.code) + xScale.bandwidth())
    .padAngle(0)
    .padRadius(innerRadius);

  // Axis
  radialAxis = (g) =>
    g.attr("text-anchor", "middle").call((g) =>
      g
        .selectAll("g")
        .data(percentSteps)
        // .join("g") // d3js version problem here ??
        .enter()
        .append("g")
        .attr("fill", "none")
        .call((g) =>
          g
            .append("circle")
            .attr("stroke", colorNeutral(900))
            .attr("stroke-opacity", 0.3)
            .attr("stroke-dasharray", "4 6")
            .attr("r", yScale)
        )
        .call((g) =>
          g
            .append("text")
            .attr("data-figure", (d) => d)
            // .attr("class", (d) =>
            //   hiddenLabels.includes(d) ? "hidden-tick" : "visible-tick"
            // )
            // Hidden all labels by default
            .attr("class", "hidden-tick")
            .attr("y", (d) => -yScale(d))
            .attr("dy", "0.35em")
            .style("opacity", 0.7)
            .style("fill", colorPrimary) // TEMPORAL fill
            .text((d) => `${d}%`)
            // .text(d => d + "%" )
            // .call(cloneToImproveReadability, 2, colorNeutral(900))
        )
    )


  // Translations and formatting
  const dataLocale = ({
    es: {
      titleViz: "18 POLÍTICAS DE GASTO",
      nodeDetails: ["Se han obtenido", " puntos", "de un total de "],
      interactionNote: isMobile
        ? [
            "↓ Haz click en cada una ",
            "de las 18 políticas de gasto",
            "para ver información en detalle"
          ]
        : [
            "↑ Pasa por encima de cada una de las 18 políticas de gasto para ver información en detalle ",
            "o haz click para ir a su página."
          ],
      linkInfo: "Más información"
    },
    en: {
      titleViz: "18 SPENDING POLICIES",
      nodeDetails: ["out of", " objectives ", " have been met"],
      interactionNote: isMobile
        ? ["↓ Click on each of", "the 18 policies to", "see detailed information"]
        : [
            "↑ Hover over each of the 18 policies to see information in detail ",
            "or click on it to go to its page."
          ],
      linkInfo: "More information"
    }
  })
  
  // en-US format
  const en_US = ({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["€", ""]
  })
  // es-ES format
  const es_ES = ({
    decimal: ",",
    thousands: ".",
    //thousands: "\u00a0", // space
    grouping: [3],
    currency: ["", "\u00a0€"]
  })

  const locale = languageSelector === "en" ? en_US : es_ES;

  function formatDecimal(value) {
    // return d3.formatLocale(locale).format(",.1f")
    const f = d3.format(",.1f");
    return f(value);
  }

  // Other useful functions
  function radiansToDeg(d) {
    return d * (180 / Math.PI)
  }

  const colorNeutral = d3
    .scaleLinear()
    .range(['white', 'black'])
    .domain([0, 1000])
}
function findIcon(code, arrayDetails) {
  // console.log(arrayDetails.find(d => d.code === code))
  return arrayDetails.find(d => d.code === code).icon;
}