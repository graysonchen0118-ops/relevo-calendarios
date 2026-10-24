// Fotos reales de Unsplash. Las dos casas gemelas salen de la misma foto, cada una con su lado.
const IDS: Record<string, string> = {
  troncos: "photo-1570793005386-840846445fed",
  chalet: "photo-1595877244574-e90ce41ce089",
  lago: "photo-1619688137428-851529e61a0f",
  triangulo: "photo-1703782997454-8eb0d4d94e9c",
  lena: "photo-1568729937315-2ef5ee9cf4f2",
  balcon: "photo-1702830499141-a0634d87d6af",
  dormitorioMar: "photo-1721369483526-62f48a00b949",
  gemelas: "photo-1775183712114-b6862e0c2edf",
  dunas: "photo-1785202761458-77f267ec9303",
  celeste: "photo-1775053383038-5e248d3182a7",
  ladrillo: "photo-1759264244827-1dde5bee00a5",
  edificio: "photo-1791719422920-e4a9c0881cec",
  living: "photo-1785962019598-2c71b10357b9",
  bosque: "photo-1627750168257-9a7d3965ef8b",
};

export const foto = (key: string, w: number, h: number, fx?: number) => {
  const id = IDS[key] ?? IDS.troncos;
  const foco = fx === undefined ? "" : `&crop=focalpoint&fp-x=${fx}&fp-y=0.55`;
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop${foco}&q=72&auto=format`;
};
