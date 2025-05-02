import {getHome} from "@/lib/api"
import ErrorState from "@/components/ErrorState";

export default async function Home() {

  let homeData = null;
  let error = null;
  
  try {
    homeData = await getHome();
  } catch (err) {
    error = err.message;
  }

  if (error) {
    return (
      <ErrorState 
        message="Currently, the MoNobar library is unavailable." 
        actionText="Try Again" 
        actionDesc="We are having trouble loading the MoNobar content library. Please try refreshing the page."
        action="reload"
      />
    );
  }

  if (!homeData?.length) return null;
  return (
    <section className="flex flex-col h-screen p-8 mt-12">
      <h1 className="text-4xl mb-8">Home</h1>
      {homeData.length > 0 ? (
        <section>
          {homeData.map((item, index) => (
            <div key={index} className="">
              <a href={`/library?id=${item.Id}`} className="hover:underline">
                <h2 className="text-2xl font-bold">Latest {item.name}</h2>
              </a>
              <section className="flex flex-row gap-1 overflow-x-auto pb-2">
                {item.latest.map((item, index) => (
                  <a href={`/info?id=${item.Id}&type=${item.Type}`} key={index} className=" p-4 flex flex-col items-center min-w-[200px] w-40" title={item.Overview}>
                    <img loading="lazy" src={item.posterPath} alt={item.Name} className="w-40 h-64 object-cover rounded-lg mb-4" />
                    <h2 className="w-full text-center">{item.Name}</h2>
                  </a>
                ))}
              </section>
            </div>
          ))}
        </section>
      ) : null}
    </section>
  );
}
