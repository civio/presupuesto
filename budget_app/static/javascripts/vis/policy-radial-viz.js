function PolicyRadialViz(_selector,_data,_policyDetails) {
  // console.log(d3.version); // 7.8.1
  // console.log(d3.selection())
  // console.log(d3.selection().join())
  // console.log(d3.arc)

  var selector          = _selector,
      data              = _data,
      policyDetails     = _policyDetails,
      // year              = null,
      year,
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
      
      // outerRadius       = 300,
      // innerRadius       = 90,
      // margin            = 150,
      innerRadius,
      outerRadius,
      margin,
      // padding           = 0.09,
      padding           = 0.02,

      // imgSize           = 175,
      // iconOffset        = 25,
      // iconSize          = 25,
      imgSize,
      iconOffset,
      iconSize,

      svg,
      vizGroup,
      centralLegend,
      // imageOffsetMobile,
      interactionNote,
      petals,
      icons,
      auxEl,
      auxNodeGroup,
      auxNodeLinks,
      radialChart,
      nodeGroup,
      percentageGroup,
      titleGroup,

      xScale,
      yScale,
      yScaleAux,
      radialAxis,

      // imgURL            = "https://static.observableusercontent.com/files/46700676dabb57e8a456eeb06a3cfd18ac69c7637140295e06deed890c1b7810bfa46456b2d91f043c148c1448c614629333ad7d21dd6b467b206e9ca86015d0"
      imgURL,
      imgTitleMobileURL_ES = "/static/assets/radialViz_title_mobile_ES.jpg",
      imgTitleDesktopURL_ES = "/static/assets/radialViz_title_desktop_ES.png"
      imgTitleMobileURL_EN = "/static/assets/radialViz_title_mobile_EN.jpg"
      imgTitleDesktopURL_EN = "/static/assets/radialViz_title_desktop_EN.png"
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

    // Set dimensions, add resize event & center viz group
    setDimensions();
    d3.select(window).on('resize', this.resize);

    vizGroup = svg.append("g")
    centerViz();

    // if (!isMobile) {
    //   centralLegend.call(createLegend);
    // } else {
    //   centralLegend
    //     .attr("transform", `translate(0, ${-height / 2 + 80})`)
    //     .call(createLegend);
    // }


    ///////////////
    // Set scales
    setXScale();
    setYScale();
    setYScaleAux();

    // Create central legend
    // const imageOffsetMobile = -height / 2 + 80;

    centralLegend = vizGroup.append("g").attr("id", "central-legend")
      // .attr("transform", isMobile ? `translate(0, ${imageOffsetMobile})` : "")
    centralLegend.call(createLegend)
    setLegendContentAndPosition()

    ///////////////
    // Set radial axis
    vizGroup.append("g").attr("id", "radial-axis")
      .call(radialAxis);

    ///////////////
    // 0. Create aux elements for interactions
    auxEl = vizGroup.append("g").attr("id", "aux-el");
    auxNodeGroup = auxEl
      .selectAll("g")
      .data(data)
      // .join("g")
      .enter()
      .append("g");
    
    auxNodeLinks = auxNodeGroup 
      .append("a")
      .attr("target", "_self")

    auxNodeLinks
      .append("path")
      .attr("d", auxArcInteractions)
      .style("fill", "transparent")
      .style("cursor", "pointer")
      .on("mouseover", onMouseOver)
      .on("mouseleave", onMouseOut);

    // Add URL links as svg titles
    auxNodeGroup
    .append("title")
    .append("path")

  // 1. Petals
  // Prepare Radial chart
  radialChart = vizGroup
    .append("g")
    .attr("id", "node-el")
    .style("pointer-events", "none");
  
    // Here?
  nodeGroup = radialChart.selectAll("g").data(data)
  // .join("g");
    .enter()
    .append("g");

  // Create petals from 0,0
  petals = nodeGroup
      .append("path")
      .attr("class", "petal")
      .attr("data-code", (d) => d.code)
      .attr("d", arc)
      .style("fill", colorPrimary)
      .style("opacity", baseOpacityPetals);

  // 2. Icons
  // Prepare icons. We locate x,y coordinates later
  icons = nodeGroup
   .append("image")
   .attr("class", "icon")
   .style("opacity", baseOpacityIcons);

  //  3. Percents %
  // Prepare percentages %
  percentageGroup = nodeGroup
  .append("g")
  .attr("class", "percentage-group")
  // // When no data
  // .attr("visibility", (d) =>
  //   isMobile || d[`value_${year}`] === "NA" ? "hidden" : "visible"
  // )
  .style("transform", (d) =>
    isMobile ? "" : `rotate(${xScale(d.code) + xScale.bandwidth() / 2}rad)`
  );

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
  .style("fill", colorPrimary)



  //  4. Titles
  // Prepare titles
  titleGroup = nodeGroup
    .append("g")
    .attr("class", "policy-group")
    .style("font-weight", 800)
    .style("dominant-baseline", "middle");

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

  // Create invisible title texts
  titleGroup.each(function (a) {
    const el = d3.select(this);
    // console.log(el)
    const offset = 15;
    // const labelLines = a.labelSplitted;
    const labelLines = findPolicyDetail("labelSplitted",a.code, policyDetails);
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


    // if (!isMobile) {
    //   titleGroup.call(transition, baseOpacityTexts);
    // } else {
    //   titleGroup.style("fill", "white").style("opacity", 0);
    // }

    // 5. Others
    // Title
    if (isMobile) {
      const titleVizGroup = vizGroup
        .append("g")
        .attr("class", "titleVizGroup")
        .attr("transform", `translate(0,${outerRadius + 50})`);
      const rectWidth = outerRadius * 2;
      const rectHeight = 40;
      titleVizGroup
        .append("rect")
        .attr("class", "title-rect")
        .attr("x", -rectWidth / 2)
        .attr("y", -rectHeight / 2)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .style("opacity", baseOpacityPetals + 0.1)
        .style("fill", colorPrimary);
      titleVizGroup
        .append("text")
        .attr("class", "title-text")
        .style("font-weight", 800)
        .style("text-anchor", "middle")
        .style("dominant-baseline", "middle")
        .style("font-size", "16px")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .text(dataLocale[languageSelector].titleViz)
        .style("fill", colorNeutral(0));
    }
    // Interaction note
   interactionNote = vizGroup
      .append("g")
      .attr("class", "interaction-note")
      .append("text")
      .attr("x", 0)
      .attr("fill", colorNeutral(500))
      .style("text-anchor", "middle")
      
 
  
  
    // Node details
    const detailsOffsetMobile = height / 2 - 100;
    const nodeDetails = vizGroup
      .append("g")
      .attr("class", "node-details")
      .attr("transform", `translate(0,${isMobile ? detailsOffsetMobile : -10})`)
      .style("opacity", 0)
      .style("font-size", isMobile ? "15px" : "17px");
    const textOffsetDesktop = languageSelector === "es" ? -10 : -40;
    const textGroup = nodeDetails
      .append("text")
      .attr("x", 0)
      .attr("y", isMobile ? -20 : textOffsetDesktop)
      .attr("fill", colorNeutral(900))
      //.style("opacity", yearWithNoData ? 0 : 1) // Hidding details when there is no data
      .style("text-anchor", "middle");

    if (languageSelector === "es") {
      textGroup.append("tspan").text(dataLocale[languageSelector].nodeDetails[0]); // Se han obtenido ...
      textGroup
        .append("tspan")
        .attr("class", "data-partialValue") // ... x puntos ...
        .attr("x", 0)
        .attr("dy", 20);
      textGroup
        .append("tspan")
        .attr("class", "data-fromTotal") // ... de un total de ....
        .attr("x", 0)
        .attr("dy", 20);
      textGroup
        .append("tspan")
        .attr("class", "data-totalValue") // ... x
        .attr("x", 0)
        .attr("dy", 20);
    } else {
      textGroup
        .append("tspan")
        .attr("class", "data-partialValue") // x ...
        .attr("x", 0)
        .attr("dy", 20);
      textGroup
        .append("tspan")
        .attr("class", "data-fromTotal") // ... out of ...
        .attr("x", 0)
        .attr("dy", 20);
      textGroup
        .append("tspan")
        .attr("class", "data-totalValue") // ... x ...
        .attr("x", 0)
        .attr("dy", 20);
      textGroup
        .append("tspan")
        .attr("x", 0)
        .attr("dy", 20)
        .text(dataLocale[languageSelector].nodeDetails[2]); // ...have been meet
    }

    if (isMobile) {
      const anchor = nodeDetails
        .append("a")
        .attr("class", "data-link")
        .attr("target", "_self")
        .style("text-decoration", "underline")
        .style("font-weight", 600)
        .style("fill", colorPrimary);
      anchor
        .append("text")
        .style("text-anchor", "middle")
        .attr("dy", 70)
        .style("fill", colorPrimary)
        .text(dataLocale[languageSelector].linkInfo); // More info
    }


    return this;
  };

  // Update
  this.update = function(_year) {
    year = _year;
    console.log("this.update function", "Year", year)

    ////////
    // 0. Aux elements
    // Update url with current year
    // console.log(auxNodeLinks)
    auxNodeLinks
      .attr("href", isMobile ? null : (d) => `${findPolicyDetail("url",d.code, policyDetails)}&year=${year}`)
    auxNodeGroup.selectAll("title")
      .text((d) => `${findPolicyDetail("url",d.code, policyDetails)}&year=${year}`)

    ////////
    // 1. Update Petals

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
    setIconParameters()
    icons
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("href", d => `/static/assets/${findPolicyDetail("icon",d.code, policyDetails)}_${isMobile ? "color" : "white"}.svg`)
      .transition("unbreak")
      .duration(updateDuration)
      .attr("x", (d) => auxArcPixels.centroid(d)[0] - iconSize / 2)
      .attr("y", (d) => auxArcPixels.centroid(d)[1] - iconSize / 2);


    ////////
    // 3.Update %% content & position
    if (!isMobile) {
      percentageGroup
        .selectAll("text") // Selecting both the visible text and the white clone
        .style("opacity", 0)
        .transition()
        .duration(updateDuration + 300)
        // With no data
        .style("opacity", (d) => (d[`value_${year}`] === "NA" ? 0 : 1))
        .attr("x", 0)
        .call(setPercentsPosition)
        // .attr("y", function (d) {
        //   const offset = 14;
        //   return d.isUpperHalf
        //     ? -yScale(d[`value_${year}`]) - offset
        //     : yScale(d[`value_${year}`]) + offset;
        // })
        // Adding no data possiblity
        .text((d) =>
          d[`value_${year}`] ? formatDecimal(d[`value_${year}`]) + "%" : ""
        )
    }

    ////////
    // 4.Update titles position
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
          // Passing an argument to a call function
          .call(setTitlesPosition, a)

          // .attr("x", function (d) {
          //   const offset = a[`value_${year}`] === "NA" ? 10 : 20;
          //   if (a[`value_${year}`] !== "NA") {
          //     return a.isLefttHalf
          //       ? -yScale(a[`value_${year}`] + offset)
          //       : yScale(a[`value_${year}`] + offset);
          //     // When no data
          //   } else {
          //     return a.isLefttHalf
          //       ? -yScale(100 + offset)
          //       : yScale(100 + offset);
          //   }
          // });
      });
    }

    // TODO: Organize this
    if (isMobile) {
      titleGroup.style("fill", "white").style("opacity", 0);
      // titleGroup.call(transition, baseOpacityTexts);
    } else {
      titleGroup.style("fill", "unset").style("opacity", baseOpacityTexts);
    }


    // 5. Update other elements position
    setInteractionNotePosition()
    
    return this;
  }

  // Resize event handler
  this.resize = function() {
    if (parseInt(svg.attr('width')) === $(selector).width())
      return;

    // 0. 
    setDimensions();
    centerViz();

    // Update legend img if necessary and place it well
    setLegendContentAndPosition()

    // Update scales
    setXScale();
    setYScale();
    setYScaleAux();

    // Update axis
    updateRadialAxis()

    // 1.Redraw petals
    arc.outerRadius((d) => yScale(d[`value_${year}`]))
    petals.attr("d", arc);

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
    setIconParameters()
    icons
    .attr("width", iconSize)
    .attr("height", iconSize)
    .attr("href", d => `/static/assets/${findPolicyDetail("icon",d.code, policyDetails)}_${isMobile ? "color" : "white"}.svg`)
    // .transition("unbreak")
    // .duration(updateDuration)
      .attr("x", (d) => auxArcPixels.centroid(d)[0] - iconSize / 2)
      .attr("y", (d) => auxArcPixels.centroid(d)[1] - iconSize / 2)
      // Change icon color depending on size
      .attr("href", d => `/static/assets/${findPolicyDetail("icon",d.code, policyDetails)}_${isMobile ? "color" : "white"}.svg`)

    // 3.Update % position
    percentageGroup
      .selectAll("text") 
      .call(setPercentsPosition)
      // .attr("y", function (d) {
      //   const offset = 14;
      //   return d.isUpperHalf
      //     ? -yScale(d[`value_${year}`]) - offset
      //     : yScale(d[`value_${year}`]) + offset;
      // })

    // 4.Update titles position
    titleGroup.each(function (a) {
      const el = d3.select(this);
      el.selectAll("text") 
        .call(setTitlesPosition, a)
    })

    // 5. Other elements position
    setInteractionNotePosition()

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
    innerRadius = isMobile ? 20 : 90;
    margin = isMobile ? 30 : 160;
    outerRadius = myWidth / 2 - margin;
    // console.log("innerRadius", innerRadius);
    // console.log("margin", margin);
    // console.log("outerRadius", outerRadius);

    yScale = d3
    // .scaleRadial()
    .scaleLinear()
    .domain([0, 100]) // Values are percents 0-100%
    .range([innerRadius, outerRadius])
  }
  function setYScaleAux() {
    yScaleAux = d3
    // .scaleRadial()
    .scaleLinear()
    .domain([0, 100]) // Values are percents 0-100%
    .range([innerRadius, myWidth / 2])
  }

  // Set main element dimensions
  function setDimensions() {
    width = $(selector).width();
    // console.log("setDimensions -> width", width);
    isMobile = width < mediaQueryLimit;
    // console.log("isMobile?", isMobile);

    myWidth = Math.min(maxWidth, width);
    height = isMobile ? myWidth + 400 : myWidth;
    // console.log("myWidth", myWidth)
    // console.log("height", height)

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
    vizGroup
      .attr("transform", `translate(${myWidth / 2}, ${height / 2})`); // Middle point
  }
  // function placeLegend() {
  //   const imageOffsetMobile = -height / 2 + 80;

  //   if (!isMobile) {
  //     // centralLegend.call(createLegend);
  //   } else {
  //     centralLegend
  //       .attr("transform", `translate(0, ${-height / 2 + 80})`)
  //       // .call(createLegend);
  //   }
  // }

  function setPercentsPosition(selection) {
    selection
      .attr("y", function (d) {
        const offset = 14;
        return d.isUpperHalf
          ? -yScale(d[`value_${year}`]) - offset
          : yScale(d[`value_${year}`]) + offset;
      })
  }
  function setTitlesPosition(selection, a) {
    selection
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
      })
  }

  function setInteractionNotePosition() {
    console.log("?")
    interactionNote
    // .select("text")
    .attr("y", isMobile ? -height / 2 + 140 : height / 2 - 60)
    .style("font-size", isMobile ? "15px" : "14px");
    
    interactionNote
    .selectAll("tspan")
    .remove()

    interactionNote
    .selectAll("tspan")
    .data(dataLocale[languageSelector][`${isMobile ? "interactionNote_mobile" : "interactionNote_desktop"}`])
    // .join("tspan")
    .enter()
    .append("tspan")
    .text((d) => d)
    .attr("x", 0)
    .attr("dy", (d, i) => (isMobile ? 20 : 18));
  }

  function setIconParameters() {
    iconOffset = isMobile ? -15 : 25;
    iconSize = isMobile ? 20 : 25;

  }
  // Interactions
  // https://github.com/d3/d3-selection/blob/v3.0.0/README.md#selection_on
  // function onMouseOver(event, d, i) {
    // console.log(event, d, i)
  function onMouseOver(d) {
    // console.log(d)
    const thisCode = d.code;
    const myItem = data.find((e) => e.code === thisCode);
    const petalWithData = myItem[`value_${year}`] !== "NA";
  
    // Higlight current node
    d3.selectAll(`#node-el > g > *`)
      .transition()
      .duration(100)
      .style("opacity", function (e, f, selection) {
        let hideOpacity = "";
        // https://stackoverflow.com/questions/50698083/find-tag-name-of-svg-element-using-d3
        const tagName = this.tagName;
        if (tagName === "text" || tagName === "g")
          hideOpacity = hidingOpacityTexts;
        else if (tagName === "path") hideOpacity = hidingOpacityPetals;
        else if (tagName === "image" && isMobile) hideOpacity = 0;
  
        return e.code == thisCode ? finalOpacityPetals : hideOpacity;
      });

    // Hide center legend (just on desktop)
    if (!isMobile) d3.select("#central-legend").style("opacity", 0);

    if (isMobile) d3.select(".titleVizGroup").style("opacity", 0);

    // Show all hidden ticks
    d3.selectAll(".hidden-tick").style("visibility", "visible");

    // Hide % legend when hovering on first/last items and avoy overlay
    const isFirstOrLastEl = extremeCodes().includes(thisCode);
    if (isFirstOrLastEl)
      d3.selectAll("[data-figure]").style("visibility", "hidden");

    // Show %%
    d3.selectAll(".percentage-group").style("visibility", "visible");

    // Show node details
    const detailedInfo = d3
      .select(".node-details")
      .style("opacity", petalWithData ? 1 : 0);

    detailedInfo
      .select(".data-partialValue")
      .style("fill", colorPrimary)
      .style("font-size", isMobile ? "18px" : "16px")
      .style("font-weight", 800)
      .text(
        languageSelector === "es"
          ? formatDecimal(myItem[`partial_${year}`]) +
              dataLocale[languageSelector].nodeDetails[1]
          : formatDecimal(myItem[`partial_${year}`])
      );

    detailedInfo.select(".data-fromTotal").text(
      languageSelector === "es"
        ? dataLocale[languageSelector].nodeDetails[2]
        : dataLocale[languageSelector].nodeDetails[0] //out of
    ); // de un total de

    detailedInfo
      .select(".data-totalValue")
      .style("fill", colorPrimary)
      .style("font-size", isMobile ? "18px" : "16px")
      .style("font-weight", 800)
      .text(
        languageSelector === "es"
          ? myItem[`total_${year}`]
          : myItem[`total_${year}`] +
              dataLocale[languageSelector].nodeDetails[1]
      );
  }
  // function onMouseOut(event, d, i) {
    // console.log(event, d, i)
  function onMouseOut(d) {
    // console.log(d)
    // Back to "normal" state
    d3.selectAll(`#node-el > g > *`)
    .transition()
    .duration(100)
    .style("opacity", function () {
      // https://stackoverflow.com/questions/50698083/find-tag-name-of-svg-element-using-d3
      const tagName = this.tagName;
      const classAttr = d3.select(this).attr("class");

      // Hide policy titles in mobile
      if (classAttr === "policy-group" && isMobile) return 0;
      // Manage the rest of elemnts based on tags
      else if (tagName === "text" || tagName === "g") return baseOpacityTexts;
      else if (tagName === "path") return baseOpacityPetals;
      else if (tagName === "image") return baseOpacityIcons;
    });

    // Hide first ticks
    d3.selectAll("[data-figure]").style("visibility", function(d) {
      const isHiddenClass = (d3.select(this).attr("class")) === "hidden-tick";
      return isHiddenClass ? "hidden" : "visible"
    });
    
    // Hide %%
    if(isMobile) d3.selectAll(".percentage-group").style("visibility", "hidden");
    
    // Show center legend
    d3.select("#central-legend").style("opacity", 1);
    //if (isMobile) d3.select(".title-text").style("opacity", 1);
    if (isMobile) d3.select(".titleVizGroup").style("opacity", 1);

    // Hide node details
    d3.select(".node-details")
      .style("opacity", 0)
      .select(".data-objectives")
      .html("");
  }


  // Generators
  function createLegend (selection) {
    // imgSize = isMobile ? 280 : innerRadius * 2 - 5;

    selection
      .append("image")
      // .attr("transform", `translate(${-imgSize / 2}, ${-imgSize / 2})`)
      // .attr("href", isMobile ? imgTitleMobileURL_ES : imgTitleDesktopURL_ES)
      .attr("x", 0)
      .attr("y", 0)
      // .attr("width", imgSize)
      // .attr("height", imgSize)
  }

  function setLegendContentAndPosition() {
    imgSize = isMobile ? 280 : innerRadius * 2 - 5;
    const imageOffsetMobile = -height / 2 + 80;

    centralLegend
      .attr("transform", isMobile ? `translate(0, ${imageOffsetMobile})` : "")

    centralLegend
      .select("image")
      .attr("width", imgSize)
      .attr("height", imgSize)
      .attr("transform", `translate(${-imgSize / 2}, ${-imgSize / 2})`)
      .attr("href", isMobile ? imgTitleMobileURL_ES : imgTitleDesktopURL_ES)
      // .attr("transform", isMobile ? `translate(${-imgSize / 2}, ${-height / 2 })` : `translate(${-imgSize / 2}, ${-imgSize / 2})`)
      
  } 

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

  function updateRadialAxis() {
    svg.select("#radial-axis")
      .selectAll("circle")
      .attr("r", yScale)

    svg.select("#radial-axis")
      .selectAll("text")
      .attr("y", (d) => -yScale(d))
  }


  // Translations and formatting
  const dataLocale = ({
    es: {
      titleViz: "18 POLÍTICAS DE GASTO",
      nodeDetails: ["Se han obtenido", " puntos", "de un total de "],
      interactionNote_mobile:  [
            "↓ Haz click en cada una ",
            "de las 18 políticas de gasto",
            "para ver información en detalle"
          ],
        interactionNote_desktop:  [
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

  // const colorNeutral = () => d3
  //   .scaleLinear()
  //   .range(['white', 'black'])
  //   .domain([0, 1000])

  function findPolicyDetail(detail, code, arrayDetails) {
    return arrayDetails.find(d => d.code === code)[detail];
  }

  function extremeCodes() {
    const codes = data.map((d) => d.code);
    return [codes[0], codes[codes.length - 1]];
  }
}