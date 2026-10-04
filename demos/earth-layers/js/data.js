/* =========================================================
   Earth Layers Explorer – Lesson Content
   Tailored specifically for Grade 2 (Ages 7-8).
   Clear, simple, friendly science vocabulary.
   ========================================================= */
window.EARTH_DATA = {
  layers: [
    {
      id: "crust",
      number: 1,
      name: "Crust",
      emoji: "🏔️",
      color: "#8B5A2B",
      accent: "#D4A373",
      text: "#ffffff",
      inner: 4.92,
      outer: 5.0,
      tagline: "The cool rocky shell we live on!",
      depth: "0 – 70 km deep",
      state: "Solid rock & soil",
      temp: "Up to 900 °C",
      heat: 0.15,
      like: "As thin as the skin on an apple or peach!",
      facts: [
        "Trees, oceans, mountains, and all people live on the crust.",
        "It is made of hard rock, sand, and soil.",
        "The crust is cracked into giant puzzle pieces that fit together around the planet."
      ],
      wow: "Even the deepest hole ever dug by humans only scratched the very top of the crust!"
    },
    {
      id: "mantle",
      number: 2,
      name: "Mantle",
      emoji: "🌋",
      color: "#D9480F",
      accent: "#FF922B",
      text: "#ffffff",
      inner: 2.75,
      outer: 4.92,
      tagline: "The thickest layer of hot, gooey rock!",
      depth: "70 – 2,900 km deep",
      state: "Hot, gooey melted rock",
      temp: "1,000 – 3,700 °C",
      heat: 0.58,
      like: "Hot rock that moves very slowly, like warm honey or thick dough!",
      facts: [
        "It is about 2,900 km thick — by far the biggest layer inside Earth!",
        "Hot melted rock from the top of the mantle can shoot out of volcanoes as lava.",
        "The hot rock creeps along so slowly that it moves at the same speed your fingernails grow!"
      ],
      wow: "The mantle is so huge that it makes up most of our entire planet!"
    },
    {
      id: "outer",
      number: 3,
      name: "Outer Core",
      emoji: "🌊",
      color: "#F59F00",
      accent: "#FFD43B",
      text: "#1e1302",
      inner: 1.1,
      outer: 2.75,
      tagline: "A swirling ocean of liquid metal!",
      depth: "2,900 – 5,150 km deep",
      state: "Boiling liquid metal",
      temp: "4,000 – 5,000 °C",
      heat: 0.84,
      like: "A giant sea of red-hot runny metal, hotter than a campfire!",
      facts: [
        "It is made of melted iron and nickel metal.",
        "It is so hot that the metal stays completely liquid, like water in a pot.",
        "The swirling liquid metal turns Earth into a giant magnet, which makes compass needles point north."
      ],
      wow: "The swirling metal creates an invisible shield in space that protects Earth from dangerous sun rays!"
    },
    {
      id: "inner",
      number: 4,
      name: "Inner Core",
      emoji: "☀️",
      color: "#FFF066",
      accent: "#FFF9DB",
      text: "#1e1302",
      inner: 0,
      outer: 1.1,
      tagline: "A super-hot solid metal ball in the middle!",
      depth: "5,150 – 6,371 km deep",
      state: "Solid heavy metal ball",
      temp: "About 5,500 °C",
      heat: 1.0,
      like: "A glowing metal ball as hot as the surface of the Sun!",
      facts: [
        "It is the hottest part of our entire planet.",
        "Even though it is white-hot, extreme pressure squeezes the metal so hard that it stays solid.",
        "It is a giant metal ball almost as big as the Moon!"
      ],
      wow: "Nobody can travel to the center of Earth! Scientists learn about it by studying vibrations that bounce through the ground."
    }
  ],

  quizFacts: [
    { q: "Which layer do we live on?", a: 0 },
    { q: "Which layer is as thin as an apple skin?", a: 0 },
    { q: "Which layer is the THICKEST layer of Earth?", a: 1 },
    { q: "Melted rock for erupting volcanoes comes from which layer?", a: 1 },
    { q: "Which layer creeps very slowly, moving at the speed fingernails grow?", a: 1 },
    { q: "Which layer is a swirling ocean of LIQUID metal?", a: 2 },
    { q: "Which layer makes Earth a magnet so compasses point north?", a: 2 },
    { q: "Which layer is the HOTTEST part of the Earth?", a: 3 },
    { q: "Which layer is a heavy SOLID metal ball in the very center?", a: 3 }
  ]
};
