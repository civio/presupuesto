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
      
      // Scales and axis
      xScale,
      yScale,
      yScaleWider,
      radialAxis,
      
      // Dimensions
      myWidth,
      height,
      maxWidth               = 900,
      mediaQueryLimit        = 600,  // Width size to use mobile layout
      isMobile,
      
      // Viz related dimensions
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

      // Viz dom structure
      svg,
      vizGroup,
      centralLegendGroup,
      auxElGroup,
      auxNodeGroup,
      radialChartGroup,
      nodeGroup,
      interactionNoteGroup,
      percentageGroup,
      titleGroup,
      titleVizGroup,
      nodeDetailsGroup,
      textGroup,

      // Interactions opacities
      baseOpacityIcons,
      baseOpacityPetals       = 0.7,
      baseOpacityTexts        = 0.9,
      hidingOpacityPetals,
      hidingOpacityTexts,
      
      // Other settings
      percentSteps            = [0, 25, 50, 75, 100], // Visible % on interaction
      updateDuration          = 600;


  // Setup
  this.setup = function() {

    ///////////////
    // Set SVG
    svg = d3.select(selector)
    .select("svg")
    // Set dimensions, add resize event & center viz group
    .call(setDimensions)

    d3.select(window).on('resize', this.resize);
    vizGroup = svg.append("g")
      .call(centerViz)

    ///////////////
    // Set scales
    setXScale();
    setYScale();
    setyScaleWider();

    // Create central legend
    centralLegendGroup = vizGroup
      .append("g")
      .attr("id", "central-legend")
      .call(createLegend)
      .call(setLegendContentAndPosition)

    ///////////////
    // Set radial axis
    vizGroup
      .append("g")
      .attr("id", "radial-axis")
      .call(radialAxis);

    ///////////////
    // 0. Create aux elements for interactions
    auxElGroup = vizGroup.append("g").attr("id", "aux-el");
    auxNodeGroup = auxElGroup
      .selectAll("g")
      .data(data)
      .enter()
      .append("g");
    
    auxNodeGroup
      .append("a")
      .attr("target", "_self")
      // The whole invisible path behaves as link
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
  radialChartGroup = vizGroup
    .append("g")
    .attr("id", "node-el")
    .style("pointer-events", "none");
  
  // Data binding to the node-group
  nodeGroup = radialChartGroup.selectAll("g").data(data)
    .enter()
    .append("g");

  // Create petals from 0,0
  nodeGroup
    .append("path")
    .attr("class", "petal")
    .attr("data-code", (d) => d.code)
    .attr("d", arc)
    .style("opacity", baseOpacityPetals);

  // 2. Icons
  // Prepare icons. We locate x,y coordinates later
  nodeGroup
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

    const rectHeight = labelLinesLenght * 20;
      titleGroup
        .selectAll("rect")
        .data([1])
        .enter()
        .append("rect")
        .attr("visibility", "hidden")
        .attr("y", -rectHeight / 2)
        .attr("height", rectHeight)
        .style("fill", colorPrimary);

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
   interactionNoteGroup = vizGroup
      .append("g")
      .attr("class", "interaction-note")
      .append("text")
      .attr("x", 0)
      .attr("fill", colorNeutral(500))
      .style("text-anchor", "middle")
      
    // Node details
    nodeDetailsGroup = vizGroup
      .append("g")
      .attr("class", "node-details")
      .style("opacity", 0);
      
    textGroup = nodeDetailsGroup
      .append("text")
      .attr("x", 0)
      .attr("fill", colorNeutral(900))
      .style("text-anchor", "middle");

    setNodeDetails();

    textGroup.append("tspan").attr("class", "data-objectives");
    //.text(i18n.nodeDetails.objectives); // 55 objetivos
    textGroup
      .append("tspan")
      .attr("x", 0)
      .attr("dy", 20)
      .text(i18n.nodeDetails.evaluated); // que se evalúan
    textGroup
      .append("tspan")
      .attr("x", 0)
      .attr("dy", 20)
      .text(i18n.nodeDetails.by); // mediante
    textGroup
      .append("tspan")
      .attr("class", "data-indicators")
      .attr("x", 0)
      .attr("dy", 20);
    //.text(i18n.nodeDetails.indicators); // 157 indicators


    // Prepare read more info (just mobile)
    const anchor = nodeDetailsGroup
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

    ////////
    // 0. Aux elements
    // Update url with current year
    auxNodeGroup.select("a")
      .attr("href", isMobile ? null : (d) => `${d.url}&year=${year}`)
    auxNodeGroup.selectAll("title")
      .text((d) => `${d.url}&year=${year}`)

    ////////
    // 1. Update Petals
  
    // Set petals transition
    arc.outerRadius(function (d) {
      if (d[`value_${year}`]) {
        return yScale(d[`value_${year}`]);
        // When no data
      } else {
        return yScale(100);
      }
    });
    // Petals
    nodeGroup.select("path") // Petals
    .style("fill", (d) =>
      d[`value_${year}`] ? colorPrimary : colorNoData
    )
    .transition("unbreak").duration(updateDuration).attr("d", arc);


    ////////
    // 2.Update icons position
    arc_modifPixelsOffset
      .innerRadius((d) =>
      d[`value_${year}`]
      ? yScale(d[`value_${year}`]) - yScale(0) + yScale(0) - iconOffset
      : yScale(100) - yScale(0) + yScale(0) - iconOffset
      )
      .outerRadius((d) =>
      d[`value_${year}`]
      ? yScale(d[`value_${year}`]) - yScale(0) + yScale(0) - iconOffset
      : yScale(100) - yScale(0) + yScale(0) - iconOffset
      );
    setIconParameters()
    nodeGroup
      .selectAll(".icon")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("href", function(d) {
        let colorIcon;
          if(isMobile) {
            colorIcon = d[`value_${year}`] ? "color" : "grey"
          } else {
            colorIcon = "white"
          }
        return `/static/assets/${findPolicyDetail("icon",d.code, policyDetails)}_${colorIcon}.svg`
        
      })
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
            a[`value_${year}`] ? "unset" : textFillNoData
          )
          // Passing an argument to a call function
          .call(setTitlesPosition, a)
      });
    }
    titleGroup
      .call(setRectOnMobileLabels)

    // 5. Update other elements position
    interactionNoteGroup
      .call(setInteractionNotePosition)
    nodeDetailsGroup
      .select("a > text")
      .call(addMoreInfoContent)
    titleVizGroup.call(setMobileTitlePosition);

    return this;
  }

  // Resize event handler
  this.resize = function() {
    if (parseInt(svg.attr('width')) === $(selector).width())
      return;

    // 0. 
    svg.call(setDimensions);
    vizGroup.call(centerViz)

    // Update legend img if necessary and place it well
    centralLegendGroup
      .call(setLegendContentAndPosition)

    // Update scales
    setXScale();
    setYScale();
    setyScaleWider();

    // Update axis
    updateRadialAxis()

    // 1.Redraw petals
    arc.outerRadius((d) => yScale(d[`value_${year}`]))
    nodeGroup.select("path") // Petals
      .attr("d", arc);

    // 2.Update icons position
    arc_modifPixelsOffset
      .innerRadius((d) =>
      d[`value_${year}`]
      ? yScale(d[`value_${year}`]) - yScale(0) + yScale(0) - iconOffset
      : yScale(100) - yScale(0) + yScale(0) - iconOffset
      )
      .outerRadius((d) =>
      d[`value_${year}`]
      ? yScale(d[`value_${year}`]) - yScale(0) + yScale(0) - iconOffset
      : yScale(100) - yScale(0) + yScale(0) - iconOffset
      );
    setIconParameters()
    nodeGroup
      .selectAll(".icon")
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
    titleGroup
    .call(setRectOnMobileLabels)


    // 5. Other elements position
    // Interaction note
    interactionNoteGroup
      .call(setInteractionNotePosition)
    // Node Details
    setNodeDetails();
    nodeDetailsGroup
      .select("a > text")
      .call(addMoreInfoContent)
    // Title viz on mobile
    titleVizGroup.call(setMobileTitlePosition);
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
  function setDimensions(selection) {
    width = $(selector).width();
    isMobile = width < mediaQueryLimit;

    myWidth = Math.min(maxWidth, width);
    height = isMobile ? myWidth + 400 : myWidth;

    // Set main element height
    selection
    .attr("height", height )
    .attr("width", myWidth )
    .style("font", "10px sans-serif");
  }
  // Center the whole group
  function centerViz(selection) {
    selection
      .attr("transform", `translate(${myWidth / 2}, ${height / 2})`); // Middle point
  }

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
  function setPercentsPosition(selection) {
    selection
      .attr("y", function (d) {
        if(!isMobile) {
          if (d[`value_${year}`]) { 
            const offset = 14;
            return d.isUpperHalf
              ? -yScale(d[`value_${year}`]) - offset
              : yScale(d[`value_${year}`]) + offset;
          } else return 100
        } else return 0
      })
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
        d[`value_${year}`] ? formatDecimal(d[`value_${year}`]) + "%" : ""
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
  function setTitlesPosition(selection, a) {
    selection
      .attr("transform", (d) =>
        a.isLefttHalf && !isMobile ? "rotate(180)" : "rotate(0)"
      )
      .attr("x", function (d) {
        if(isMobile) return 0
        else {
          const offset = a[`value_${year}`] === "NA" ? 10 : 20;
          if (a[`value_${year}`]) {
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
  function setTitlesStyling(selection) {
    selection
      .style("fill", isMobile ? colorNeutral(0) : "unset")
      .style("opacity", isMobile ? 0 : baseOpacityTexts);
  }
  function setRectOnMobileLabels(selection) {
    const rectWidth = outerRadius * 2;
    selection
      .selectAll("rect")
      .attr("visibility", isMobile ? "visible" : "hidden")
      .attr("x", -rectWidth / 2)
      .attr("width", rectWidth)
  }

  function setNodeDetails() {
    const detailsOffsetMobile = height / 2 - 100;
    nodeDetailsGroup
      .attr("transform", `translate(0,${isMobile ? detailsOffsetMobile : -10})`)
      .style("font-size", isMobile ? "15px" : "17px");
  
    const textOffsetDesktop = languageSelector === "es" ? -10 : -40;
      textGroup
      .attr("y", isMobile ? -20 : textOffsetDesktop)
  }

  function addMoreInfoContent(selection) {
    selection
    .text(isMobile ? i18n.linkInfo : ""); // More info
  }


  function setInteractionNotePosition(selection) {
    selection
      .attr("y", isMobile ? -height / 2 + 140 : height / 2 - 60)
      .style("font-size", isMobile ? "15px" : "14px");
    
      selection
      .selectAll("tspan")
      .remove()

      selection
      .selectAll("tspan")
      .data(i18n[`${isMobile ? "interactionNote_mobile" : "interactionNote_desktop"}`])
      .enter()
      .append("tspan")
      .text((d) => d)
      .attr("x", 0)
      .attr("dy", (d, i) => (isMobile ? 20 : 18));
  }

  function setMobileTitlePosition(selection) {
    selection
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

    const thisCode = d.code;
    const myItem = data.find((e) => e.code === thisCode);
    const petalWithData = myItem[`value_${year}`];
  
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
      .select(".data-objectives")
      .style("fill", colorPrimary)
      .style("font-size", isMobile ? "18px" : "16px")
      .style("font-weight", 800)
      .text(`${myItem[`objectives_${year}`]} ${
        i18n.nodeDetails.objectives
      }`);

    detailedInfo
      .select(".data-indicators")
      .style("fill", colorPrimary)
      .style("font-size", isMobile ? "18px" : "16px")
      .style("font-weight", 800)
      .text(`${myItem[`total_${year}`]} ${
        i18n.nodeDetails.indicators
      }`);
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

  const colorNeutral = d3
    .scaleLinear()
    .range(['white', 'black'])
    .domain([0, 1000])

  function findPolicyDetail(detail, code, arrayDetails) {
    return arrayDetails.find(d => d.code === code)[detail];
  }

  function extremeCodes() {
    const codes = data.map((d) => d.code);
    return [codes[0], codes[codes.length - 1]];
  }
}