import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { isOfficerOnly, officerMunicipalities } from "@/lib/roles";

/** An officer of exactly one municipality lands on it; everyone else starts at the list. */
const Home = async () => {
  const me = await getCurrentUser();
  const user = me.ok ? me.data.user : null;
  const own = user && isOfficerOnly(user) ? officerMunicipalities(user) : [];
  redirect(own.length === 1 ? `/municipalities/${own[0]}` : "/municipalities");
};

export default Home;
