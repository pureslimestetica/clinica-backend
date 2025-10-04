// app/api/_utils/treatments.ts

export type Asset = {
  id: string | number;
  name: string;
  unit?: string | null;
};

export type Application = {
  id: string | number;
  treatment_id: string | number;
  asset_id: string | number;
  quantity: number;
  // opcionalmente podemos anexar o asset já resolvido,
  // mas *não* vamos depender disso na tipagem:
  asset?: Asset | null;
};

/**
 * Agrupa as aplicações por tratamento, resolvendo nome/unidade do ativo via mapa de assets.
 * Retorna um dicionário { [treatment_id]: [{ asset_id, asset_name, unit, quantity }] }
 */
export function groupAppsByTreatment(
  apps: Application[],
  assets: Asset[]
): Record<
  string,
  { asset_id: string; asset_name: string; unit: string; quantity: number }[]
> {
  const assetsById: Record<string, Asset> = {};
  for (const a of assets) {
    assetsById[String(a.id)] = a;
  }

  const grouped: Record<
    string,
    { asset_id: string; asset_name: string; unit: string; quantity: number }[]
  > = {};

  for (const app of apps) {
    const list = (grouped[String(app.treatment_id)] ||= []);
    const asset = assetsById[String(app.asset_id)];
    list.push({
      asset_id: String(app.asset_id),
      asset_name: asset?.name ?? "",
      unit: (asset?.unit as string) ?? "",
      quantity: Number(app.quantity),
    });
  }

  return grouped;
}
