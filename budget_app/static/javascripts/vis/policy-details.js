const POLICYDETAILS = [
    {
      code: "x",
      label: "Deuda pública",
      labelSplitted: ["Deuda", "pública"],
      url: "",
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "13",
      label: "Seguridad y movilidad ciudadana",
      labelSplitted: ["Seguridad", "y movilidad", "ciudadana"],
      // url: `https://presupuestosabiertospre.madrid.es/es/politicas/13/seguridad-y-movilidad-ciudadana#view=monitoring&year=${yearSelector}`,
      url: "https://presupuestosabiertospre.madrid.es/es/politicas/13/seguridad-y-movilidad-ciudadana#view=monitoring",
      icon: "monitoring_02-siren-on",
    },
    {
      code: "15",
      label: "Vivienda y urbanismo",
      labelSplitted: ["Vivienda y", "urbanismo"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/15/vivienda-y-urbanismo#view=monitoring`,
      icon: "monitoring_03-house-building",
    },
    {
      code: "16",
      label: "Bienestar comunitario",
      labelSplitted: ["Bienestar", "comunitario"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/16/bienestar-comunitario#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "17",
      label: "Medio ambiente",
      labelSplitted: ["Medio", "ambiente"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/17/medio-ambiente#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "x",
      label: "Pensiones",
      labelSplitted: ["Pensiones"],
      url: "",
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "22",
      label: "Otras prestaciones económicas a favor de empleados",
      labelSplitted: [
        "Otras prestaciones",
        "económicas a favor",
        "de empleados"
      ],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/22/otras-prestaciones-economicas-a-favor-de-empleados#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "23",
      label: "Servicios sociales y promoción social",
      labelSplitted: ["Servicios sociales", "y promoción social"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/23/servicios-sociales-y-promocion-social#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "24",
      label: "Fomento del empleo",
      labelSplitted: ["Fomento", "del empleo"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/24/fomento-del-empleo#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "31",
      label: "Sanidad",
      labelSplitted: ["Sanidad"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/31/sanidad#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "32",
      label: "Educación",
      labelSplitted: ["Educación"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/32/educacion#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "33",
      label: "Cultura",
      labelSplitted: ["Cultura"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/33/cultura#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "34",
      label: "Deporte",
      labelSplitted: ["Deporte"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/34/deporte#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "x",
      label: "Agricultura, ganadería y pesca",
      labelSplitted: ["Agricultura,", "ganadería", "y pesca"],
      url: "",
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "x",
      label: "Industria y energía",
      labelSplitted: ["Industria", "y energía"],
      url: "",
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "43",
      label: "Comercio, turismo y pequeñas y medianas empresas",
      labelSplitted: ["Comercio, turismo", "y pequeñas y", "medianas empresas"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/43/comercio,-turismo-y-peque%C3%B1as-y-medianas-empresas#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "44",
      label: "Transporte público",
      labelSplitted: ["Transporte", "público"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/44/transporte-publico#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "x",
      label: "Infraestructuras",
      labelSplitted: ["Infraestructuras"],
      url: "",
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "46",
      label: "Investigación, desarrollo e innovación",
      labelSplitted: ["Investigación,", "desarrollo", "e innovación"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/46/investigacion,-desarrollo-e-innovaci%C3%B3n#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "49",
      label: "Otras actuaciones de caracter económico",
      labelSplitted: ["Otras actuaciones", "de caracter económico"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/49/otras-actuaciones-de-caracter-economico#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "91",
      label: "Órganos de gobierno",
      labelSplitted: ["Órganos de", "gobierno"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/91/organos-de-gobierno#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "92",
      label: "Servicios de carácter general",
      labelSplitted: ["Servicios de", "carácter general"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/92/servicios-de-caracter-general#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "93",
      label: "Administración financiera y tributaria",
      labelSplitted: ["Administración", "financiera y", "tributaria"],
      url: `https://presupuestosabiertospre.madrid.es/es/politicas/93/administracion-financiera-y-tributaria#view=monitoring`,
      icon: "monitoring_01-messages-dollar",
    },
    {
      code: "x",
      label: "Transferencias a otras administraciónes públicas",
      labelSplitted: ["Transferencias", "a otras administrac.", "públicas"],
      url: "",
      icon: "monitoring_01-messages-dollar",
    }
  ]