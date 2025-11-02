export const NavAnimation = (delay) => {
  return {
    initial: {
      y: '-100%',
      opacity: 0,
    },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        delay: delay,
        ease: "easeOut",
      }
    }
  }
}

export const SlideLeft = (delay) =>{
    return{
        hidden: {
            opacity: 0, 
            x: 100,
        },
        visible:{
            opacity: 1, 
            x: 0,
            transition: {
                duration: 1,
                delay: delay
            }
        }
    }
}