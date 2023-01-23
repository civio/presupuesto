function PolicyRadialViz(_selector, _data, i18n) {

  var selector                = _selector,
      data                    = _data,
      year,

      policyDetails           = i18n.policyDetails,
      languageSelector        = i18n.lang,
      
      // Colors
      colorPrimary            = "#003DF6",
      colorNoData             = "rgb(224, 224, 224)",
      textFillNoData          = "rgb(204, 204, 204)",
      
      baseOpacityIcons,
      baseOpacityPetals       = 0.7,
      baseOpacityTexts        = 0.9,
      hidingOpacityPetals,
      hidingOpacityTexts,
      
      // Dimensions
      myWidth,
      height,
      maxWidth               = 900,
      mediaQueryLimit        = 600,  // Width size to use mobile layout
      isMobile,
      
      innerRadius,
      outerRadius,
      margin,
      padding                 = 0.02,

      // Images settings
      titleImgSize,
      titleImgMobileURL_ES    = "/static/assets/radialViz_title_mobile_ES.jpg",
      titleImgDesktopURL_ES   = "/static/assets/radialViz_title_desktop_ES.png",
      titleImgMobileURL_EN   = "/static/assets/radialViz_title_mobile_EN.jpg",
      titleImgDesktopURL_EN   = "/static/assets/radialViz_title_desktop_EN.png",
      titleImgURL,
      iconOffset,
      iconSize,

      svg,
      vizGroup,
      centralLegend,
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
      nodeDetails,
      textGroup,
      titleVizGroup,

      xScale,
      yScale,
      yScaleWider,
      radialAxis,
      percentSteps            = [0, 25, 50, 75, 100], // Visible steps on chart when interacting

      updateDuration          = 600;

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

    ///////////////
    // Set scales
    setXScale();
    setYScale();
    setyScaleWider();

    // Create central legend
    centralLegend = vizGroup
      .append("g")
      .attr("id", "central-legend")
      .call(createLegend)
      .call(setLegendContentAndPosition)
    // setLegendContentAndPosition()

    ///////////////
    // Set radial axis
    vizGroup
      .append("g")
      .attr("id", "radial-axis")
      .call(radialAxis);

    ///////////////
    // 0. Create aux elements for interactions
    auxEl = vizGroup.append("g").attr("id", "aux-el");
    auxNodeGroup = auxEl
      .selectAll("g")
      .data(data)
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
  
  // Data binding to the node-group
  nodeGroup = radialChart.selectAll("g").data(data)
    .enter()
    .append("g");

  // Create petals from 0,0
  petals = nodeGroup
    .append("path")
    .attr("class", "petal")
    .attr("data-code", (d) => d.code)
    .attr("d", arc)
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

  // Create empty texts for percents
  percents = percentageGroup
    .append("text")
    .style("dominant-baseline", "middle")
    .attr("font-weight", 800)
    .attr("text-anchor", "middle")
    .style("fill", colorPrimary)

  //  4. Titles
  // Prepare titles
  titleGroup = nodeGroup
    .append("g")
    .attr("class", "policy-group")
    .style("font-weight", 800)
    .style("dominant-baseline", "middle");
  titleGroup.call(setTitleGroupTransforms)


  // Create invisible title texts
  titleGroup.each(function (a) {
    const el = d3.select(this);
    const labelLines = findPolicyDetail("labelSplitted",a.code, policyDetails);
    const labelLinesLenght = labelLines.length;
    const offsetBtwnLines = isMobile ? 12 : 10;

    // Simple scale to get text offsets
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
      .enter()
      .append("text")
      // Attr. "x" later on the update function
      .attr("y", 0)
      .attr("dy", (d, i) => scaleOffset(i))
      .text((d) => `${d}`)
      .style("opacity", baseOpacityTexts)
    });


    // 5. Others elements
    // Prepare title (mobile)
    titleVizGroup = vizGroup
      .append("g")
      .attr("class", "titleVizGroup")
    
    titleVizGroup
      .append("rect")
      .attr("class", "title-rect")
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
      .text(i18n.titleViz)
      .style("fill", colorNeutral(0));

    // Interaction note
   interactionNote = vizGroup
      .append("g")
      .attr("class", "interaction-note")
      .append("text")
      .attr("x", 0)
      .attr("fill", colorNeutral(500))
      .style("text-anchor", "middle")
      
    // Node details
    nodeDetails = vizGroup
      .append("g")
      .attr("class", "node-details")
      .style("opacity", 0);
      
    textGroup = nodeDetails
      .append("text")
      .attr("x", 0)
      .attr("fill", colorNeutral(900))
      //.style("opacity", yearWithNoData ? 0 : 1) // Hidding details when there is no data
      .style("text-anchor", "middle");

    setNodeDetails();

    // TODO: Refactor this
    if (languageSelector === "es") {
      textGroup.append("tspan").text(i18n.nodeDetails[0]); // Se han obtenido ...
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
        .text(i18n.nodeDetails[2]); // ...have been meet
    }

    // if (isMobile) {
      // Read more info
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

    return this;
  };

  // Update
  this.update = function(_year) {
    year = _year;
    // console.log("this.update function", "Year", year)

    ////////
    // 0. Aux elements
    // Update url with current year
    auxNodeLinks
      .attr("href", isMobile ? null : (d) => `${findPolicyDetail("url",d.code, policyDetails)}&year=${year}`)
    auxNodeGroup.selectAll("title")
      .text((d) => `${findPolicyDetail("url",d.code, policyDetails)}&year=${year}`)

    ////////
    // 1. Update Petals
  
    // Set petals transition
    arc.outerRadius(function (d) {
      if (d[`value_${year}`] !== "NA") {
        return yScale(d[`value_${year}`]);
        // When no data
      } else {
        return yScale(100);
      }
    });
    petals
    // Petals with no data
    .style("fill", (d) =>
      d[`value_${year}`] !== "NA" ? colorPrimary : colorNoData
    )
    .transition("unbreak").duration(updateDuration).attr("d", arc);


    ////////
    // 2.Update icons position
    arc_modifPixelsOffset
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
      .attr("x", (d) => arc_modifPixelsOffset.centroid(d)[0] - iconSize / 2)
      .attr("y", (d) => arc_modifPixelsOffset.centroid(d)[1] - iconSize / 2);


    ////////
    // 3.Update %% content & position
    percentageGroup
      .call(transformPercentGroup)
    percentageGroup
      .selectAll("text")
      .call(transformPercentTexts)

    // if (!isMobile) {
      percentageGroup
        .selectAll("text") // Selecting both the visible text and the white clone
        .transition()
        .duration(updateDuration + 300)
        // With no data
        .style("opacity", (d) => (d[`value_${year}`] === "NA" ? 0 : 1))
        .attr("x", 0)
        .call(setPercentsPosition)
    // }


    ////////
    // 4.Update titles position
    titleGroup
      .call(setTitleGroupTransforms)
      // Set fill and opacity attributes depending on responsive
      .call(setTitlesStyling)


    if (!isMobile) {
      titleGroup.each(function (a) {
        const el = d3.select(this);
        el.selectAll("text") 
          .transition("unbreak")
          .duration(updateDuration)
          .style("opacity", baseOpacityTexts)
          .attr("fill", (d) =>
            a[`value_${year}`] !== "NA" ? colorNeutral(1000) : textFillNoData
          )
          // Passing an argument to a call function
          .call(setTitlesPosition, a)
      });
    }

    // 5. Update other elements position
    setInteractionNotePosition()
    nodeDetails
      .select("a > text")
      .call(addMoreInfoContent)
    setMobileTitlePosition();

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
    centralLegend
      .call(setLegendContentAndPosition)

    // Update scales
    setXScale();
    setYScale();
    setyScaleWider();

    // Update axis
    updateRadialAxis()

    // 1.Redraw petals
    arc.outerRadius((d) => yScale(d[`value_${year}`]))
    petals.attr("d", arc);

    // 2.Update icons position
    arc_modifPixelsOffset
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
      .attr("x", (d) => arc_modifPixelsOffset.centroid(d)[0] - iconSize / 2)
      .attr("y", (d) => arc_modifPixelsOffset.centroid(d)[1] - iconSize / 2)
      // Change icon color depending on size
      .attr("href", d => `/static/assets/${findPolicyDetail("icon",d.code, policyDetails)}_${isMobile ? "color" : "white"}.svg`)

    // 3.Update % transformations and position
    percentageGroup
      .call(transformPercentGroup)
    percentageGroup
      .selectAll("text")
      .call(transformPercentTexts)
    percentageGroup
      .selectAll("text") 
      .call(setPercentsPosition)

    // 4.Update titles position
    titleGroup
    .call(setTitleGroupTransforms)
    // Set fill and opacity attributes depending on responsive
    .call(setTitlesStyling)

    titleGroup.each(function (a) {
      const el = d3.select(this);
      el.selectAll("text") 
        .call(setTitlesPosition, a)
    })


    // 5. Other elements position
    // Interaction note
    setInteractionNotePosition()

    // Node Details
    setNodeDetails();
    nodeDetails
      .select("a > text")
      .call(addMoreInfoContent)
    setMobileTitlePosition();
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

    yScale = d3
      // .scaleRadial()
      .scaleLinear()
      .domain([0, 100]) // Values are percents 0-100%
      .range([innerRadius, outerRadius])
  }
  function setyScaleWider() {
    yScaleWider = d3
      // .scaleRadial()
      .scaleLinear()
      .domain([0, 100]) // Values are percents 0-100%
      .range([innerRadius, myWidth / 2])
  }

  // Set main element dimensions
  function setDimensions() {
    width = $(selector).width();
    isMobile = width < mediaQueryLimit;

    myWidth = Math.min(maxWidth, width);
    height = isMobile ? myWidth + 400 : myWidth;

    // Set main element height
    svg
    .attr("height", height )
    .attr("width", myWidth )
    .style("font", "10px sans-serif");
  }
  // Center the whole group
  function centerViz() {
    vizGroup
      .attr("transform", `translate(${myWidth / 2}, ${height / 2})`); // Middle point
  }

  function setPercentsPosition(selection) {
    selection
      .attr("y", function (d) {
        if(!isMobile) {
          if (d[`value_${year}`] !== "NA") { 
            const offset = 14;
            return d.isUpperHalf
              ? -yScale(d[`value_${year}`]) - offset
              : yScale(d[`value_${year}`]) + offset;
          } else return 100
        } else return 0
      })
  }
  function setTitlesPosition(selection, a) {
    selection
      .attr("transform", (d) =>
        a.isLefttHalf && !isMobile ? "rotate(180)" : "rotate(0)"
      )
      .attr("x", function (d) {
        if(isMobile) return 0
        else {
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
        }
      })
  }

  function transformPercentGroup(selection) {
    selection
      .style("transform", (d) =>
        isMobile ? "" : `rotate(${xScale(d.code) + xScale.bandwidth() / 2}rad)`
      )
      // Hide central % on mobile devices
      .attr("visibility", (d) =>
        isMobile ? "hidden" : "unset"
      )
  }


  // .text(i18n.linkInfo); // More info
// }
  function addMoreInfoContent(selection) {
    selection
    .text(isMobile ? i18n.linkInfo : ""); // More info
  }

  function transformPercentTexts(selection) { 
    selection
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
      .attr("font-size", isMobile ? "14px" : "15px")
      .text((d) =>
        d[`value_${year}`] !== "NA" ? formatDecimal(d[`value_${year}`]) + "%" : ""
      )
}

  function setTitleGroupTransforms(selection) {
    if (!isMobile) {
      // Titles
      selection
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
      selection
        .style("font-size", "16px")
        .style("text-anchor", "middle")
        .attr("transform", `translate(0,${offsetTitleMobile})`);
    }
  }

  function setInteractionNotePosition() {
    interactionNote
      .attr("y", isMobile ? -height / 2 + 140 : height / 2 - 60)
      .style("font-size", isMobile ? "15px" : "14px");
    
    interactionNote
      .selectAll("tspan")
      .remove()

    interactionNote
      .selectAll("tspan")
      .data(i18n[`${isMobile ? "interactionNote_mobile" : "interactionNote_desktop"}`])
      .enter()
      .append("tspan")
      .text((d) => d)
      .attr("x", 0)
      .attr("dy", (d, i) => (isMobile ? 20 : 18));
  }

  function setMobileTitlePosition() {
    titleVizGroup
      .attr("transform", `translate(0,${outerRadius + 50})`);

    if(isMobile) {
      const rectWidth = outerRadius * 2;
      const rectHeight = 40;
      
      titleVizGroup
        .style("visibility", "visible")
        .select("rect")
        .attr("x", -rectWidth / 2)
        .attr("y", -rectHeight / 2)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
      
      titleVizGroup
        .select("text")
        .attr("width", rectWidth)
        .attr("height", rectHeight)
    }
    else {
      titleVizGroup
        .style("visibility", "hidden")
    }

  }

  function setTitlesStyling(selection) {
    selection
      .style("fill", isMobile ? "white" : "unset")
      .style("opacity", isMobile ? 0 : baseOpacityTexts);
  }

  function setIconParameters() {
    iconOffset = isMobile ? -15 : 25;
    iconSize = isMobile ? 20 : 25;
  }
  // Interactions
  // https://github.com/d3/d3-selection/blob/v3.0.0/README.md#selection_on
  function onMouseOver(d) {
    hidingOpacityPetals = isMobile ? 0.1 : 0.05;
    hidingOpacityTexts = isMobile ? 0 : 0.08;
    baseOpacityIcons =  isMobile ? baseOpacityPetals + 0.1 : 0.9

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
  
        return e.code == thisCode ? 1 : hideOpacity;
      });

    // Hide center legend (just on desktop)
    if (!isMobile) d3.select("#central-legend").style("opacity", 0);
    // Hide mobile title legend (just on mobile)
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
          i18n.nodeDetails[1]
          : formatDecimal(myItem[`partial_${year}`])
      );

    detailedInfo.select(".data-fromTotal").text(
      languageSelector === "es"
        ? i18n.nodeDetails[2]
        : i18n.nodeDetails[0] //out of
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
          i18n.nodeDetails[1]
      );
  }

  function onMouseOut(d) {
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
    if (isMobile) d3.select(".titleVizGroup").style("opacity", 1);

    // Hide node details
    d3.select(".node-details")
      .style("opacity", 0)
      .select(".data-objectives")
      .html("");
  }


  // Generators
  function createLegend (selection) {
    selection
      .append("image")
      .attr("x", 0)
      .attr("y", 0)
  }

  function setLegendContentAndPosition(selection) {
    titleImgSize = isMobile ? 280 : innerRadius * 2 - 5;
    // Img depending both on language and size
    if(languageSelector === "es") { 
      titleImgURL = isMobile ? titleImgMobileURL_ES : titleImgDesktopURL_ES 
    } else {
      titleImgURL =  isMobile ? titleImgMobileURL_EN : titleImgDesktopURL_EN
    }
    const imageOffsetMobile = -height / 2 + 80;

    selection
      .attr("transform", isMobile ? `translate(0, ${imageOffsetMobile})` : "")
      .select("image")
      .attr("width", titleImgSize)
      .attr("height", titleImgSize)
      .attr("transform", `translate(${-titleImgSize / 2}, ${-titleImgSize / 2})`)
      .attr("href", titleImgURL)      
  } 

   
  function setNodeDetails() {
    const detailsOffsetMobile = height / 2 - 100;
    nodeDetails
      .attr("transform", `translate(0,${isMobile ? detailsOffsetMobile : -10})`)
      .style("font-size", isMobile ? "15px" : "17px");
  
    const textOffsetDesktop = languageSelector === "es" ? -10 : -40;
      textGroup
      .attr("y", isMobile ? -20 : textOffsetDesktop)
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
  
  // To place labels inside our chart, along each petal, in a specific px position
  const arc_modifPixelsOffset = d3
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
    .innerRadius((d) => yScaleWider(0))
    .outerRadius((d) => yScaleWider(100))
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
            // Hidden all labels by default
            .attr("class", "hidden-tick")
            .attr("y", (d) => -yScale(d))
            .attr("dy", "0.35em")
            .style("opacity", 0.7)
            .style("fill", colorPrimary)
            .text((d) => `${d}%`)
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

  // TODO: Review this
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


// FIXME: Resize problems on
// - Percents
// - Titles
//  - title viz??